/**
 * 영상 교체 안내 — 이 주석은 웹 화면에 표시되지 않습니다.
 * 각 객체 하나가 영상 카드 하나입니다. 아래 Demo 값을 내 작업 정보로 바꾸세요.
 *
 * slug: 상세 주소에 들어갈 고유 이름입니다. 예: 'jeju-festival-maker'. 제목을 바꿔도 유지하세요.
 * role / period / team / stack: 상세 페이지의 역할·기간·팀·사용 기술(배열)입니다. 선택 입력입니다.
 * sections: [{ heading: '제목', body: ['본문'], images: [{ src: './media/image.png', alt: '설명' }] }]
 * cover / images: 대표 이미지 또는 추가 이미지 목록입니다. 자세한 예시는 README.md를 참고하세요.
 * github: GitHub 레포 주소. 입력하면 Code 버튼을 표시합니다. 비워 두면 숨깁니다.
 * demo: 배포 사이트 주소. 입력하면 Live Demo 버튼을 표시합니다. 비워 두면 숨깁니다.
 * video: 영상이 없어도 됩니다. 빈 문자열이거나 항목을 생략하면 텍스트 카드로 표시합니다.
 *        영상 주소. 예: './media/my-project.mp4' 또는 'https://example.com/demo.mp4'
 *        상대 경로는 이 projects.js가 있는 studio 폴더 기준입니다.
 *        권장 형식: 16:9 MP4(H.264), 소리 없이도 이해되는 짧은 화면 녹화.
 * title: 프로젝트 이름. 예: '무지개 인터랙션 실험'
 * category: 작업 분류. 예: 'WebGL', 'AI', '웹 개발', 'UX/UI', '공모전'
 * year: 제작 연도. 예: '2026'. 빈 문자열이면 화면에서 연도를 생략합니다.
 * description: 만든 목적, 핵심 기능, 본인 역할, 사용 기술, 결과를 짧게 작성합니다.
 *
 * 한글 안내는 주석에만 적었습니다. title/category/description 등에 한글을
 * 입력하면 그 값은 실제 화면에 표시됩니다. 영어 화면을 유지하려면 영어로 쓰세요.
 * 현재 실제 영상은 원본 MotionSites 데모이고, 화면의 프로젝트 정보만 Demo입니다.
 * Gallery는 앞 20개, Projects는 앞 24개를 표시합니다. 25–30은 예비 슬롯입니다.
 * 자세한 교체 순서는 같은 폴더의 README.md를 참고하세요.
 */

export const projects = [
  // 01번 카드
  {
    slug: 'campus-3dmap',
    video: './media/demo-01.mp4',
    title: 'campus 3Dmap',
    category: 'Development | Service',
    year: '2026',
    description: '건물 입구부터 건물 안의 호실까지 안내하는 3D 캠퍼스 길찾기 서비스',
    github: 'https://github.com/xxrainow/campus3DMap',
    demo: 'https://2026endpoint.github.io/team12/',
  },
  // 02번 카드
  {
    slug: 'find a piece of art in Paris',
    video: '',
    title: 'Find a piece of art in Paris',
    category: 'Web Interaction Design',
    year: '2025',
    description: '풍부한 인터렉션 경험과 함께 파리의 미술 작품을 탐험해보세요',
    github: 'https://github.com/xxrainow/Web-Interactive-Design-2025',
    demo: 'https://xxrainow.github.io/Web-Interactive-Design-2025/final-web/',
  },
  // 03번 카드
  {
    slug: 'jeju-festival-maker',
    video: './media/demo-03.mp4',
    title: 'jeju-festival-maker',
    category: 'Development | AI Agent',
    year: '2026',
    description:
      '한 문장으로 입력한 조건을 바탕으로 축제 아이디어를 제안하고, 제주 데이터로 실행 조건을 확인하는 AI Agent 서비스입니다 \
    / 2026 제주 AI·빅데이터 활용 AI Agent 개발 챌린지 출품작',
    github: 'https://github.com/xxrainow/jeju-festival-maker',
    demo: 'https://jeju-festival-maker.streamlit.app/',
    youtube: 'https://youtu.be/1j2_b9JA_Cs',
  },
  // 04번 카드
  {
    slug: 'ploop',
    video: '',
    title: 'Ploop',
    category: 'Development | App service',
    year: '2025',
    description: 'Pick, Plog, and Keep the Loop Going! APAC Solution Challenge 2025 Project | Side Impact 2025 Project',
    github: 'https://github.com/Ploop-2025-Solution-Challenge',
    demo: '',
    youtube: 'https://www.youtube.com/watch?feature=shared&v=rB9DLo2qyMw'
  },
  // 05번 카드
  {
    slug: 'demo-05',
    video: '',
    title: 'Demo 05',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 06번 카드
  {
    slug: 'demo-06',
    video: '',
    title: 'Demo 06',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 07번 카드
  {
    slug: 'demo-07',
    video: '',
    title: 'Demo 07',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 08번 카드
  {
    slug: 'demo-08',
    video: '',
    title: 'Demo 08',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 09번 카드
  {
    slug: 'demo-09',
    video: '',
    title: 'Demo 09',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 10번 카드
  {
    slug: 'demo-10',
    video: '',
    title: 'Demo 10',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 11번 카드
  {
    slug: 'demo-11',
    video: '',
    title: 'Demo 11',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 12번 카드
  {
    slug: 'demo-12',
    video: '',
    title: 'Demo 12',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 13번 카드
  {
    slug: 'demo-13',
    video: '',
    title: 'Demo 13',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 14번 카드
  {
    slug: 'demo-14',
    video: '',
    title: 'Demo 14',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 15번 카드
  {
    slug: 'demo-15',
    video: '',
    title: 'Demo 15',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 16번 카드
  {
    slug: 'demo-16',
    video: '',
    title: 'Demo 16',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 17번 카드
  {
    slug: 'demo-17',
    video: '',
    title: 'Demo 17',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 18번 카드
  {
    slug: 'demo-18',
    video: '',
    title: 'Demo 18',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 19번 카드
  {
    slug: 'demo-19',
    video: '',
    title: 'Demo 19',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
  // 20번 카드
  {
    slug: 'demo-20',
    video: '',
    title: 'Demo 20',
    category: 'Demo',
    year: '',
    description: 'Demo',
    github: '',
    demo: '',
  },
].map((project, index) => ({
  ...project,
  id: index + 1,
  slug: project.slug || 'project-' + (index + 1),
  detailUrl: new URL('project/' + encodeURIComponent(project.slug || 'project-' + (index + 1)) + '/', import.meta.url).href,
  // 파일명에 .mp4까지 포함하세요. 외부 주소와 로컬 상대 경로 모두 지원합니다.
  url: project.video?.trim()
    ? new URL(project.video.trim(), import.meta.url).href
    : '',
}));
