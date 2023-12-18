import { IsNumber, IsOptional } from 'class-validator';
import { BasePaginationDto } from 'src/common/dto/base-pagination.dto';

export class PaginatePostDto extends BasePaginationDto {
  // 좋아요 갯수 몇개 이상
  @IsNumber()
  @IsOptional()
  where__likeCount__more_than: number;

  // 제목에 무엇이 ''이 포함된 것들
  @IsNumber()
  @IsOptional()
  where__title_i_like: string;
}
