/**
 * 영상 교체 안내 — 이 주석은 웹 화면에 표시되지 않습니다.
 * 각 객체 하나가 영상 카드 하나입니다. 아래 Demo 값을 내 작업 정보로 바꾸세요.
 *
 * pdf: PDF 경로 또는 문서 배열. 예: [{ title: '발표자료', src: './media/file.pdf', pages: [1, 3] }].
 *      문자열 1개·문자열 배열도 지원합니다. 빈 값이면 PDF 영역을 숨깁니다.
 * pdfPages: 미리보기 페이지 번호(1부터). 예: [1, 3, 5, 8]. 기본 앞 4장, 최대 6장.
 * ppt: 원본 PPT/PPTX 경로(선택). 입력하면 Download PPT 버튼을 표시합니다.
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
    slug: 'ploop',
    video: './media/ploop-01.mp4',
    title: 'Ploop',
    category: 'Development | App service',
    year: '2025',
    description:
      'Pick, Plog, and Keep the Loop Going! APAC Solution Challenge 2025 Project | Side Impact 2025 Project',
    github: 'https://github.com/Ploop-2025-Solution-Challenge',
    demo: '',
    youtube: 'https://www.youtube.com/watch?feature=shared&v=rB9DLo2qyMw',
    pdf: '',
    pdfPages: [1, 3, 5, 8], // 미리 볼 페이지
    ppt: '', // 원본 PPT도 제공할 때만 경로 입력
  },
  // 02번 카드
  {
    slug: 'paris',
    video: './media/paris-02.mp4',
    title: 'Find a piece of art in Paris',
    category: 'Web Interaction Design',
    year: '2025',
    description: '풍부한 인터렉션 경험과 함께 파리의 미술 작품을 탐험해보세요',
    github: 'https://github.com/xxrainow/Web-Interactive-Design-2025',
    demo: 'https://xxrainow.github.io/Web-Interactive-Design-2025/final-web/',
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
  },
  // 03번 카드
  {
    slug: 'campus-3dmap',
    video: './media/3dmap-03.mp4',
    title: 'campus 3Dmap',
    category: 'Development | Service',
    year: '2026',
    description:
      '건물 입구부터 건물 안의 호실까지 안내하는 3D 캠퍼스 길찾기 서비스',
    github: 'https://github.com/xxrainow/campus3DMap',
    demo: 'https://2026endpoint.github.io/team12/',
    pdf: './media/3dmap-03.pdf',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
  },
  // 04번 카드

  {
    slug: 'jeju-festival-maker',
    video: './media/jeju-04.mp4',
    title: 'jeju-festival-maker',
    category: 'Development | AI Agent',
    year: '2026',
    description:
      '한 문장으로 입력한 조건을 바탕으로 축제 아이디어를 제안하고, 제주 데이터로 실행 조건을 확인하는 AI Agent 서비스입니다 \
    / 2026 제주 AI·빅데이터 활용 AI Agent 개발 챌린지 출품작',
    github: 'https://github.com/xxrainow/jeju-festival-maker',
    demo: 'https://jeju-festival-maker.streamlit.app/',
    youtube: 'https://youtu.be/1j2_b9JA_Cs',
    pdf: './media/jeju-festival-maker.pdf?v=verified-20261123',
    pdfPages: [1, 3, 5, 8],
    ppt: '',
  },
  // 05번 카드
  {
    "slug": "a.dot",
    "video": "./media/a.dot-05.mp4",
    "title": "A.dot UX Redesign",
    "category": "UX Design",
    "year": "2025",
    "description": "사용자의 질문을 기다리는 챗봇에서, 일상의 맥락을 먼저 읽고 제안하는 AI 비서로. 직장인의 하루를 중심으로 에이닷의 기능 연결과 UX/UI를 재설계한 프로젝트입니다.",
    "github": "",
    "demo": "",
    "pdf": [
      {
        "title": "UX Research & Service Proposal",
        "src": "./media/a.dot-05.pdf",
        "pages": [
          3,
          5,
          8,
          11
        ]
      },
      {
        "title": "UX/UI Renewal",
        "src": "./media/a.dot2-05.pdf",
        "pages": [
          9,
          13,
          18,
          30
        ]
      }
    ],
    "ppt": "",
    "role": "팀 기반 UX 리서치·서비스 기획 / UX·UI 리뉴얼 제안",
    "team": "UX 리서치·서비스 제안 4인 팀 · UI 리뉴얼 Shin Jiwoo",
    "cover": "./media/adot-briefing.jpg",
    "sections": [
      {
        "heading": "문제 정의 — 기능은 많지만, 일상으로 이어지지 않는 경험",
        "body": [
          "이 프로젝트는 에이닷을 여러 기능의 모음이 아니라 ‘나만의 AI 비서’로 경험하게 만드는 데서 출발했습니다. 조사에서 드러난 핵심 문제는 사용자가 일부 기능에만 머무르고, 일정·통화·기록 사이의 연결을 직접 만들어야 한다는 점이었습니다.",
          "기능을 추가하는 대신, 사용자가 필요한 순간에 기능을 발견하고 다음 행동으로 자연스럽게 이어갈 수 있는 흐름을 설계했습니다."
        ]
      },
      {
        "heading": "사용자 이해 — 직장인의 하루에서 찾은 기회",
        "body": [
          "팀 리서치는 에이닷 사용자 인터뷰, Think Aloud 관찰, 직장인의 생활 패턴 인터뷰를 통해 진행했습니다. 원하는 기능을 찾기 어려운 탐색 구조, 번거로운 일정 등록, 직접 질문해야만 돌아오는 수동적인 답변이 주요 문제로 정리됐습니다.",
          "어피니티 다이어그램으로 수집한 의견을 묶고, 페르소나와 유저 저니맵을 통해 출근 준비·이동·업무·퇴근·개인 시간의 맥락을 연결했습니다. 여기서 일정 자동화, 상황에 맞는 브리핑, 통화·회의 기록과 캘린더의 연동을 핵심 기회로 도출했습니다."
        ],
        "images": [
          {
            "src": "./media/adot-research.jpg",
            "alt": "사용자 의견을 핵심 니즈로 묶은 어피니티 다이어그램",
            "caption": "팀 서비스 제안서 · 사용자 조사에서 도출한 핵심 니즈"
          }
        ]
      },
      {
        "heading": "설계 방향 — 질문 중심에서 맥락 중심으로",
        "body": [
          "리디자인의 목표는 ‘직장인의 삶 속에 자연스럽게 녹아드는 맞춤형 자동화 AI 비서’입니다. 홈을 대화 입력창 중심에서 개인화된 브리핑 중심으로 바꾸고, 전화·일정·대화·기록을 각기 독립된 기능이 아닌 연결된 경험으로 재구성했습니다.",
          "온보딩에서는 생활 패턴과 이동 수단 등 브리핑에 필요한 정보를 수집하도록 설계했습니다. 사용자가 기능을 먼저 이해할 수 있는 워크스루를 더하고, 기능 간 정보 구조와 주요 작업 흐름을 정리했습니다."
        ],
        "images": [
          {
            "src": "./media/adot-architecture.jpg",
            "alt": "온보딩과 브리핑, 전화, 일정, 대화, 기록의 정보 구조",
            "caption": "UX/UI 리뉴얼 제안 · 기능을 연결하는 Information Architecture"
          }
        ]
      },
      {
        "heading": "브리핑 — 검색하지 않아도 확인하는 오늘의 정보",
        "body": [
          "시간·장소·일정 데이터를 바탕으로 필요한 정보를 카드로 제공하는 타임라인형 홈을 제안했습니다. 날씨와 이동 정보, 오늘의 할 일을 하루의 흐름 안에서 함께 확인하도록 구성했습니다.",
          "브리핑은 앱 안에서만 끝나지 않도록 잠금화면 알림과 연결했습니다. 사용자가 질문을 만들거나 메뉴를 탐색하기 전에 필요한 정보를 발견하게 하는 것이 설계의 중심입니다."
        ],
        "images": [
          {
            "src": "./media/adot-briefing.jpg",
            "alt": "시간순 브리핑 카드와 잠금화면 알림 UI",
            "caption": "시간을 기준으로 정보를 묶은 브리핑과 잠금화면 알림 제안"
          }
        ]
      },
      {
        "heading": "통화와 일정 — 요약에서 실제 행동까지",
        "body": [
          "통화가 끝난 뒤 AI 제안을 확인하고 일정을 등록하는 과정을 하나의 흐름으로 연결했습니다. 저장 여부를 선택하고, 상단에 배치된 AI 제안에서 제목·날짜·시간이 채워진 일정 작성 화면으로 이동하도록 설계했습니다.",
          "캘린더에는 오늘의 할 일과 개인화된 리마인더를 함께 배치했습니다. 단순한 알림 전달을 넘어, 사용자가 다음 행동을 시작할 수 있도록 브리핑과 관련 기능을 연결하는 방식입니다."
        ],
        "images": [
          {
            "src": "./media/adot-call-calendar.jpg",
            "alt": "통화 내용을 기반으로 일정을 자동완성하는 화면 흐름",
            "caption": "통화 요약에서 일정 등록으로 연결되는 UX/UI 제안"
          }
        ]
      },
      {
        "heading": "대화와 기록 — 도구를 고르고 정리하는 부담 줄이기",
        "body": [
          "대화에서는 질문에 맞는 LLM을 추천하는 Auto 모드, 정보성·감성 대화에 따른 시각적 구분, 여러 모델의 답변 비교와 선택을 제안했습니다. 모델 선택과 답변 조정의 부담을 사용자가 전부 떠안지 않도록 한 설계입니다.",
          "기록에서는 녹음·메모·사진을 한 흐름에 모으고 AI 요약과 문서 생성 결과를 우선적으로 보여주도록 구성했습니다. 회의 중 기록부터 정리·공유까지 앱을 오가는 과정을 줄이는 데 초점을 맞췄습니다."
        ],
        "images": [
          {
            "src": "./media/adot-chat.jpg",
            "alt": "대화 맥락에 따른 UI 테마와 답변 비교 화면",
            "caption": "대화의 맥락과 선택을 반영하는 UI 제안"
          },
          {
            "src": "./media/adot-notes.jpg",
            "alt": "녹음, 메모, 사진과 AI 문서 생성 기능을 통합한 기록 화면",
            "caption": "기록 수집과 후처리를 연결하는 화면 제안"
          }
        ]
      },
      {
        "heading": "결과와 다음 검증",
        "body": [
          "결과물은 사용자 조사와 서비스 시나리오를 정리한 제안서, 그리고 온보딩·브리핑·전화·캘린더·대화·기록을 구체화한 UX/UI 리뉴얼 자료입니다. 기존 화면의 AS-IS와 개선 방향인 TO-BE를 작업 흐름과 함께 제시했습니다.",
          "이 페이지에서 설명하는 기능은 리디자인 제안이며, 실제 서비스에 적용됐거나 효과가 검증됐다는 의미는 아닙니다. 다음 검증 과제는 첫 사용자의 기능 이해도, 일정 등록 과정의 과업 성공률과 소요 시간, 브리핑 정보의 적절성을 사용성 테스트로 확인하는 것입니다."
        ]
      }
    ]
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
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
    pdf: '',
    pdfPages: [1, 2, 3, 4],
    ppt: '',
  },
].map((project, index) => ({
  ...project,
  id: index + 1,
  slug: project.slug || 'project-' + (index + 1),
  detailUrl: new URL(
    'project/' +
      encodeURIComponent(project.slug || 'project-' + (index + 1)) +
      '/',
    import.meta.url,
  ).href,
  // 파일명에 .mp4까지 포함하세요. 외부 주소와 로컬 상대 경로 모두 지원합니다.
  url: project.video?.trim()
    ? new URL(project.video.trim(), import.meta.url).href
    : '',
}));
