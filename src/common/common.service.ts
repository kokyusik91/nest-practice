import { BadRequestException, Injectable } from '@nestjs/common';
import { BasePaginationDto } from './dto/base-pagination.dto';
import {
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { BaseModel } from './entity/base.entity';
import { FILTER_MAPPER } from './const/filter-mapper.const';
import { ConfigService } from '@nestjs/config';
import { ENV_HOST_KEY, ENV_PROTOCOL_KEY } from './const/env-keys.const';

@Injectable()
export class CommonService {
  constructor(private readonly configService: ConfigService) {}

  paginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    if (dto.page) {
      return this.pagePaginate(dto, repository, overrideFindOptions);
    } else {
      return this.cursorPaginate(dto, repository, overrideFindOptions, path);
    }
  }

  private async pagePaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
  ) {
    const findOptions = this.composeFindOptions<T>(dto);

    const [data, count] = await repository.findAndCount({
      ...findOptions,
      ...overrideFindOptions,
    });

    return {
      data: data,
      total: count,
    };
  }

  private async cursorPaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string,
  ) {
    /**
     * where__likeCount__more_than : 특정 좋아요 갯수 이상
     *
     * where__title__ilike
     */

    const findOptions = this.composeFindOptions<T>(dto);

    const results = await repository.find({
      ...findOptions,
      ...overrideFindOptions,
    });

    const lastItem =
      results.length > 0 && results.length === dto.take ? results.at(-1) : null;

    const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
    const host = this.configService.get<string>(ENV_HOST_KEY);

    const nextUrl = lastItem && new URL(`${protocol}://${host}/${path}`);

    // url을 만드는 로직
    if (nextUrl) {
      /**
       * dto의 키값들을 looping 하면서, 키값에 해당되는 value가 존재하면, param에 그대로 붙여넣는다.
       */
      for (const key of Object.keys(dto)) {
        if (dto[key]) {
          // where__id_more_than과 where__id_less_than 키값이 아닐경우 (해당 키값은 아래서 핸들링 할거임.)
          if (
            key !== 'where__id__more_than' &&
            key !== 'where__id__less_than'
          ) {
            nextUrl.searchParams.append(key, dto[key]);
          }
        }
      }

      let key = null;

      if (dto.order__createdAt === 'ASC') {
        key = 'where__id__more_than';
      } else {
        key = 'where__id__less_than';
      }
      nextUrl.searchParams.append(key, lastItem.id.toString());
    }

    return {
      data: results,
      cursor: {
        after: lastItem?.id ?? null,
      },
      count: results.length,
      next: nextUrl?.toString() ?? null,
    };
  }

  private composeFindOptions<T extends BaseModel>(
    dto: BasePaginationDto,
  ): FindManyOptions<T> {
    /**
     * where,
     * order,
     * take,
     * skip,
     */
    /**
     * DTO의 현재 생긴 구조는 아래와 같다.
     *
     * {
     * where__id__more_than : 1,
     * oreder_createdAt : 'ASC'
     * }
     *
     * where query를 일반화 시켜야한다.
     *
     * 1) where로 시작한다면 필터 로직을 적용한다.
     * 2) order로 시작한다면 정렬 로직을 적용한다.
     * 3) 필터 로직을 적용한다면 '__'기준으로 split 했을때 3개의 값으로 나뉘는지, 2개의 값으로 나뉘는지 확인한다.
     *    3-1) 3개의 값으로 나뉜다면 FILTER_MAPPER에서 해당되는 operator 함수를 찾아서 적용한다.
     *        ['where', 'id', 'more_than']
     *    3-2) 2개의 값으로 나뉜다면 정확한 값을 필터하는 것이기 때문에 operator 없이 적용한다.
     *        ['where', 'id'] => 그냥 id값으로 조회
     * 4) order의 경우 3-2와 같이 적용한다.
     */

    let where: FindOptionsWhere<T> = {};
    let order: FindOptionsOrder<T> = {};

    for (const [key, value] of Object.entries(dto)) {
      // key -> where__id__less_then
      // value -> 1

      if (key.startsWith('where__')) {
        where = {
          ...where,
          ...this.parseWhereFilter(key, value),
        };
      } else if (key.startsWith('order__')) {
        order = {
          ...order,
          ...this.parseWhereFilter(key, value),
        };
      }
    }

    return {
      where,
      order,
      take: dto.take,
      skip: dto.page ? dto.take * (dto.page - 1) : null,
    };
  }

  private parseWhereFilter<T extends BaseModel>(
    key: string,
    value: any,
  ): FindOptionsWhere<T> | FindOptionsOrder<T> {
    const options: FindOptionsWhere<T> = {};

    /**
     * 예를들어 where__id__more_than
     * ['where', 'id', 'more_than']
     */

    const split = key.split('__');
    if (split.length !== 2 && split.length !== 3) {
      throw new BadRequestException(
        `where 필터는 '__'로 split 했을때 길이가 2또는 3이어야 한다. - 문제되는 키값 : ${key}`,
      );
    }
    /**
     * 길이가 2일 경우는
     * where__id = 3
     *
     * FindOptionWhere로 풀어보면
     * 아래와 같다
     *
     * {
     *  where : {
     *    id : 3
     *  }
     * }
     */

    if (split.length === 2) {
      // ['where', 'id']
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, field] = split;
      /**
       * field -> 'id'
       * value ->  3
       */
      options[field] = value;
    } else {
      /**
       * 길이가 3일 경우에는 Typeorm 유틸리티 적용이 필요한 경우이다.
       *
       * where__id__more_Than의 경우
       * where은 버려도 되고 두번째 값은 필터할 키값이 되고,
       * 세번째 값은 typeorm 유틸리티가 된다.
       *
       * FILTER_MAPPER에 미리 정의해둔 값들로
       * field 값에 FILTER_MAPPER에서 해당되는 utilty를 가져온후 값에 적용
       */
      // ['where', 'id', 'more_than']
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, field, operator] = split;
      // const values = value.toString().split(',');

      // field -> id
      // operator -> more_than
      // FILTER_MAPPER[operator] -> MoreThan

      // if (operator === 'between') {
      //   options[field] = FILTER_MAPPER[operator](value[0], values[1]);
      // } else {
      //   options[field] = FILTER_MAPPER[operator](value);
      // }
      if (operator === 'i_like') {
        options[field] = FILTER_MAPPER[operator](`%${value}%`);
      } else {
        options[field] = FILTER_MAPPER[operator](value);
      }
    }

    return options;
  }

  // private parseOrderFilter<T extends BaseModel>(
  //   key: string,
  //   value: any,
  // ): FindOptionsOrder<T> {
  //   const order: FindOptionsOrder<T> = {};

  //   /**
  //    * order는 무조건 두개로 스플릿 된다.
  //    */

  //   const split = key.split('__');
  //   if (split.length !== 2) {
  //     throw new BadRequestException(
  //       `order 필터는 '__'로 split 했을때 길이가 2여야 합니다. - 문제되는 키값 : ${key}`,
  //     );
  //   }

  //   const [_, field] = split;

  //   order[field] = value;
  //   return order;
  // }
}
