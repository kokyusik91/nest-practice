import { join } from 'path';

// 서버 프로젝트의 루트 폴더 (최상단의 절대 경로)
// /Users/asdasdas/adasd/asdasd/NESTJS_SERVER
export const PROJECT_ROOT_PATH = process.cwd();

// 외부에서 접근 가능한 파일들을 모아놓은 폴더 이름
export const PUBLIC_FOLDER_NAME = 'public';

// 포스트와 관련된 이미지들을 저장할 폴더 이름
export const POSTS_FOLDER_NAME = 'posts';

// 실제 공개폴더의 절대 경로
// /(프로젝트 위치)/public
export const PUBLIC_FOLDER_PATH = join(PROJECT_ROOT_PATH, PUBLIC_FOLDER_NAME); // 경로를 만들어줌 join

// 포스트 관련된 이미지를 저장할 폴더 절대 경로
// /(프로젝트 위치)/public/posts
export const POST_IMAGE_PATH = join(PUBLIC_FOLDER_PATH, POSTS_FOLDER_NAME);

// 절대 경로 X
// /public/posts
export const POST_PUBLIC_IMAGE_PATH = join(
  PUBLIC_FOLDER_NAME,
  POSTS_FOLDER_NAME,
);
