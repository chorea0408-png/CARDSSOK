import React, { useEffect } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';

const EFFECTIVE_DATE = '2026년 7월 7일';
const CONTACT_EMAIL = 'chorea0408@gmail.com';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
  </section>
);

export const PrivacyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = '개인정보처리방침 | 카드쑉';
    return () => { document.title = prevTitle; };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="h-14 border-b border-gray-200 px-4 flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          돌아가기
        </button>
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="font-extrabold text-gray-900 text-sm" style={{ letterSpacing: '-0.03em' }}>카드쑉</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">개인정보처리방침</h1>
        <p className="text-xs text-gray-400 mb-10">시행일자: {EFFECTIVE_DATE}</p>

        <Section title="1. 총칙">
          <p>
            카드쑉(이하 "서비스")은 별도의 회원가입이나 로그인 없이 이용할 수 있는 무료 카드뉴스 슬라이드
            생성 도구입니다. 서비스는 이용자가 입력한 원고 텍스트와 편집 데이터를 서버로 전송하거나
            저장하지 않으며, 모든 작업물은 이용자의 브라우저(localStorage)에만 저장됩니다.
          </p>
        </Section>

        <Section title="2. 수집하는 개인정보 항목 및 수집 방법">
          <p>
            서비스는 회원가입 절차가 없어 이름, 이메일 등 개인을 식별할 수 있는 정보를 별도로 수집하지
            않습니다. 다만 아래와 같이 서비스 운영 및 광고 게재 과정에서 자동으로 생성되는 정보가 있을 수
            있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>기기·브라우저 정보, 접속 IP, 방문 일시 등 서비스 이용 과정에서 자동 생성되는 로그 정보</li>
            <li>이용자가 직접 업로드한 배경 이미지·로고 이미지 (브라우저 내에만 저장되며 외부로 전송되지 않음)</li>
          </ul>
        </Section>

        <Section title="3. 개인정보의 처리 및 보유 기간">
          <p>
            원고 텍스트, 슬라이드 디자인 설정, 업로드한 이미지 등 서비스 이용 중 생성되는 모든 데이터는
            이용자의 브라우저 localStorage에만 저장되며, 운영자의 서버로 전송되지 않습니다. 따라서 브라우저
            저장 데이터를 삭제(캐시 삭제, 시크릿 모드 종료 등)하면 해당 정보는 즉시 그리고 영구적으로
            삭제됩니다.
          </p>
        </Section>

        <Section title="4. 쿠키(Cookie) 및 광고 서비스 안내">
          <p>
            서비스는 무료 운영을 위해 Google AdSense를 통한 광고를 게재하고 있습니다. Google 등 광고 제공업체는
            이용자의 관심사에 기반한 맞춤형 광고를 제공하기 위해 쿠키를 사용할 수 있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Google을 비롯한 제3자 공급업체는 쿠키를 사용하여 이용자의 이전 방문 기록을 바탕으로 광고를 게재합니다.</li>
            <li>
              이용자는{' '}
              <a
                href="https://adssettings.google.com/authenticated"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                Google 광고 설정 페이지
              </a>
              에서 맞춤형 광고를 원하지 않을 경우 이를 비활성화할 수 있습니다.
            </li>
            <li>
              브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있으나, 이 경우 서비스의 일부 기능(작업물
              자동 저장 등) 이용에 제한이 있을 수 있습니다.
            </li>
          </ul>
        </Section>

        <Section title="5. 이용자의 권리">
          <p>
            서비스는 이용자의 개인정보를 서버에 별도로 보관하지 않으므로, 이용자는 언제든지 브라우저의
            저장 데이터(localStorage, 쿠키)를 직접 삭제함으로써 본인의 정보를 완전히 삭제할 수 있습니다.
          </p>
        </Section>

        <Section title="6. 문의처">
          <p>
            개인정보처리방침에 대해 궁금한 점이 있으시면 아래 연락처로 문의해 주시기 바랍니다.
          </p>
          <p>
            운영자: 카드쑉 운영자<br />
            이메일:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <Section title="7. 개인정보처리방침의 변경">
          <p>
            이 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 개정될 수 있으며, 변경 시 서비스 내
            공지사항 또는 본 페이지를 통해 고지합니다.
          </p>
        </Section>
      </main>
    </div>
  );
};
