import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout, PublicLayout } from '@/components/layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MascotIllustration } from '@/components/illustrations';
import { AnimatedPage } from '@/components/motion';
import { RouteMetadataManager } from '@/seo/RouteMetadataManager';

const Landing = lazy(() => import('@/pages/Landing'));
const About = lazy(() => import('@/pages/About'));
const Parents = lazy(() => import('@/pages/Parents'));
const ParentsFaq = lazy(() => import('@/pages/ParentsFaq'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const TopicPillar = lazy(() => import('@/pages/TopicPillar'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const ParentDashboard = lazy(() => import('@/pages/ParentDashboard'));
const ProfilePicker = lazy(() => import('@/pages/ProfilePicker'));
const CountingPicnic = lazy(() => import('@/pages/CountingPicnic'));
const MoreOrLessMarket = lazy(() => import('@/pages/MoreOrLessMarket'));
const ColorGarden = lazy(() => import('@/pages/ColorGarden'));
const NumberLineJumps = lazy(() => import('@/pages/NumberLineJumps'));
const PictureToWordBuilder = lazy(() => import('@/pages/PictureToWordBuilder'));
const LetterSoundMatch = lazy(() => import('@/pages/LetterSoundMatch'));
const LetterTracingTrail = lazy(() => import('@/pages/LetterTracingTrail'));

function RouteFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-theme-bg)',
      }}
      aria-busy="true"
      aria-live="polite"
    >
      <MascotIllustration
        variant="loading"
        size={128}
        className="floating-element"
      />
    </div>
  );
}

function withAnimatedPage(element: ReactNode) {
  return <AnimatedPage>{element}</AnimatedPage>;
}

export default function App() {
  return (
    <>
      <RouteMetadataManager />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public marketing pages */}
          <Route path="/" element={<PublicLayout>{withAnimatedPage(<Landing />)}</PublicLayout>} />
          <Route path="/about" element={<PublicLayout>{withAnimatedPage(<About />)}</PublicLayout>} />
          <Route path="/parents" element={<PublicLayout>{withAnimatedPage(<Parents />)}</PublicLayout>} />
          <Route path="/parents/faq" element={<PublicLayout>{withAnimatedPage(<ParentsFaq />)}</PublicLayout>} />
          <Route path="/terms" element={<PublicLayout>{withAnimatedPage(<Terms />)}</PublicLayout>} />
          <Route path="/privacy" element={<PublicLayout>{withAnimatedPage(<Privacy />)}</PublicLayout>} />
          <Route path="/letters" element={<PublicLayout>{withAnimatedPage(<TopicPillar topic="letters" />)}</PublicLayout>} />
          <Route path="/numbers" element={<PublicLayout>{withAnimatedPage(<TopicPillar topic="numbers" />)}</PublicLayout>} />
          <Route path="/reading" element={<PublicLayout>{withAnimatedPage(<TopicPillar topic="reading" />)}</PublicLayout>} />

          {/* Login — public header/footer */}
          <Route path="/login" element={<PublicLayout>{withAnimatedPage(<Login />)}</PublicLayout>} />

          {/* App pages — app header with child info + navigation */}
          <Route
            path="/profiles"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<ProfilePicker />)}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<Home />)}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<ParentDashboard />)}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/counting-picnic"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<CountingPicnic />)}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/more-or-less-market"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<MoreOrLessMarket />)}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/number-line-jumps"
            element={
              <ProtectedRoute>
                <AppLayout><NumberLineJumps /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/colors/color-garden"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<ColorGarden />)}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/picture-to-word-builder"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<PictureToWordBuilder />)}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/letters/letter-sound-match"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<LetterSoundMatch />)}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/letters/letter-tracing-trail"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<LetterTracingTrail />)}</AppLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<PublicLayout>{withAnimatedPage(<NotFound />)}</PublicLayout>} />
        </Routes>
      </Suspense>
    </>
  );
}
