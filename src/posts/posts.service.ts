import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThan, MoreThan, Repository } from 'typeorm';
import { PostsModel } from './entities/posts.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { HOST, PROTOCOL } from 'src/common/const/env.const';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postsRepository: Repository<PostsModel>,
  ) {}

  async getAllPosts() {
    return this.postsRepository.find({
      relations: ['author'],
    });
  }

  // 테스트 용
  async generatePosts(userId: number) {
    for (let i = 0; i < 100; i++) {
      await this.createPost(userId, {
        title: `임의로 생성된 포스트 제목 ${i} 😨`,
        content: `임의로 생성된 포스트 내용 ${i} 🧑🏼‍💻`,
      });
    }
  }

  async paginatePosts(dto: PaginatePostDto) {
    if (dto.page) {
      return this.pagePageinatePosts(dto);
    } else {
      return this.cursorPageinatePosts(dto);
    }
  }

  // 오름차 순으로 정렬하는 pageination만 구현한다.
  async pagePageinatePosts(dto: PaginatePostDto) {
    /**
     * data : Data[],
     * total : number,
     * next? : url
     */

    const [posts, count] = await this.postsRepository.findAndCount({
      skip: dto.take * (dto.page - 1),
      take: dto.page,
      order: {
        createdAt: dto.order__createdAt,
      },
    });

    return {
      data: posts,
      total: count,
    };
  }

  async cursorPageinatePosts(dto: PaginatePostDto) {
    const where: FindOptionsWhere<PostsModel> = {};

    if (dto.where__id_less_than) {
      where.id = LessThan(dto.where__id_less_than);
    } else if (dto.where__id_more_than) {
      where.id = MoreThan(dto.where__id_more_than);
    }

    const posts = await this.postsRepository.find({
      where,
      // order__createdAt
      order: {
        createdAt: dto.order__createdAt,
      },
      take: dto.take,
    });

    // 해당되는 포스트가 0개 이상이면, 마지막 포스트를 가져오고 아니면 null 반환
    const lastItem =
      posts.length > 0 && posts.length === dto.take ? posts.at(-1) : null;

    const nextUrl = lastItem && new URL(`${PROTOCOL}://${HOST}/posts`);

    if (nextUrl) {
      //
      for (const key of Object.keys(dto)) {
        if (dto[key]) {
          if (key !== 'where__id_more_than' && key !== 'where__id_less_than') {
            nextUrl.searchParams.append(key, dto[key]);
          }
        }
      }

      let key = null;

      if (dto.order__createdAt === 'ASC') {
        key = 'where__id_more_than';
      } else {
        key = 'where__id_less_than';
      }
      nextUrl.searchParams.append(key, lastItem.id.toString());
    }

    /**
     * Response
     *
     * data : Data[],
     * cursor : {
     *    after  :마지막 Data의 Id
     *  },
     * count : 응답한 데이터으 갯수
     * next : 다음 요청을 할때 사용할 URL
     */

    return {
      data: posts,
      cusor: {
        after: lastItem?.id ?? null,
      },
      count: posts.length,
      next: nextUrl?.toString() ?? null,
    };
  }

  async getPostById(id: number) {
    const post = await this.postsRepository.findOne({
      where: {
        id,
      },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException();
    }

    return post;
  }

  async createPost(authorId: number, postDto: CreatePostDto) {
    // 1) create => 저장할 객체를 생성한다.
    // 2) save => 객체를 생성한다. (create 메서드에서 생성한 객체로)

    const post = this.postsRepository.create({
      author: { id: authorId },
      ...postDto,
      likeCount: 0,
      commentCount: 0,
    });

    // id가 추가된 post
    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async updatePost(postId: number, postDto: UpdatePostDto) {
    const { title, content } = postDto;
    // save 기능
    // 1) 만약에 데이터가 존재하지 않는다면 (id 기준으로) 새로 생성한다.
    // 2) 만약에 데이터가 존재한다면 (같은 id의 값이 존재한다면) 존재하던 값을 업데이트한다.

    const post = await this.postsRepository.findOne({
      where: {
        id: postId,
      },
    });
    // post 업스면
    if (!post) {
      throw new NotFoundException();
    }

    if (title) {
      post.title = title;
    }

    if (content) {
      post.content = content;
    }

    // post는 id가 존재하는 post이다.
    const newPost = await this.postsRepository.save(post);

    return newPost;
  }

  async deletePost(id: number) {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException();
    }

    await this.postsRepository.delete(id);

    return id;
  }
}
