import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout, PublicLayout } from '@/components/layout';
import { AnimatedPage } from '@/components/motion';
import { ScrollToTop } from '@/components/routing/ScrollToTop';
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
const ProtectedRoute = lazy(async () => {
  const module = await import('@/components/ProtectedRoute');
  return { default: module.ProtectedRoute };
});
const CountingPicnic = lazy(() => import('@/pages/CountingPicnic'));
const MoreOrLessMarket = lazy(() => import('@/pages/MoreOrLessMarket'));
const ShapeSafari = lazy(() => import('@/pages/ShapeSafari'));
const ColorGarden = lazy(() => import('@/pages/ColorGarden'));
const NumberLineJumps = lazy(() => import('@/pages/NumberLineJumps'));
const PictureToWordBuilder = lazy(() => import('@/pages/PictureToWordBuilder'));
const SightWordSprint = lazy(() => import('@/pages/SightWordSprint'));
const DecodableMicroStories = lazy(() => import('@/pages/DecodableMicroStories'));
const InteractiveHandbook = lazy(() => import('@/pages/InteractiveHandbook'));
const RootFamilyStickers = lazy(() => import('@/pages/RootFamilyStickers'));
const ConfusableLetterContrast = lazy(() => import('@/pages/ConfusableLetterContrast'));
const LetterSoundMatch = lazy(() => import('@/pages/LetterSoundMatch'));
const LetterTracingTrail = lazy(() => import('@/pages/LetterTracingTrail'));
const LetterSkyCatcher = lazy(() => import('@/pages/LetterSkyCatcher'));

function RouteFallback() {
  return (
    <div className="route-fallback" aria-busy="true" aria-live="polite">
      <span className="route-fallback__halo" aria-hidden="true" />
      <div className="route-fallback__panel">
        <div className="route-fallback__skeleton" aria-hidden="true">
          <span className="route-fallback__skeleton-pill route-fallback__skeleton-pill--title" />
          <span className="route-fallback__skeleton-pill route-fallback__skeleton-pill--line" />
          <span className="route-fallback__skeleton-pill route-fallback__skeleton-pill--line-short" />
        </div>
      </div>
    </div>
  );
}

type RouteShell = 'public' | 'app';

function withAnimatedPage(element: ReactNode, shell: RouteShell) {
  if (shell === 'public') {
    return <>{element}</>;
  }

  return <AnimatedPage className={`animated-page--shell-${shell}`}>{element}</AnimatedPage>;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <RouteMetadataManager />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public marketing pages */}
          <Route path="/" element={<PublicLayout>{withAnimatedPage(<Landing />, 'public')}</PublicLayout>} />
          <Route path="/about" element={<PublicLayout>{withAnimatedPage(<About />, 'public')}</PublicLayout>} />
          <Route path="/parents" element={<PublicLayout>{withAnimatedPage(<Parents />, 'public')}</PublicLayout>} />
          <Route path="/parents/faq" element={<PublicLayout>{withAnimatedPage(<ParentsFaq />, 'public')}</PublicLayout>} />
          <Route path="/terms" element={<PublicLayout>{withAnimatedPage(<Terms />, 'public')}</PublicLayout>} />
          <Route path="/privacy" element={<PublicLayout>{withAnimatedPage(<Privacy />, 'public')}</PublicLayout>} />
          <Route path="/letters" element={<PublicLayout>{withAnimatedPage(<TopicPillar topic="letters" />, 'public')}</PublicLayout>} />
          <Route path="/numbers" element={<PublicLayout>{withAnimatedPage(<TopicPillar topic="numbers" />, 'public')}</PublicLayout>} />
          <Route path="/reading" element={<PublicLayout>{withAnimatedPage(<TopicPillar topic="reading" />, 'public')}</PublicLayout>} />

          {/* Login — public header/footer */}
          <Route path="/login" element={<PublicLayout>{withAnimatedPage(<Login />, 'public')}</PublicLayout>} />

          {/* App pages — app header with child info + navigation */}
          <Route
            path="/profiles"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<ProfilePicker />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<Home />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<ParentDashboard />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/counting-picnic"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<CountingPicnic />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/more-or-less-market"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<MoreOrLessMarket />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/shape-safari"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<ShapeSafari />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/number-line-jumps"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<NumberLineJumps />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/colors/color-garden"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<ColorGarden />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/picture-to-word-builder"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<PictureToWordBuilder />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/sight-word-sprint"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<SightWordSprint />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/decodable-micro-stories"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<DecodableMicroStories />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/interactive-handbook"
            element={
              <ProtectedRoute>
                <AppLayout><InteractiveHandbook /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/root-family-stickers"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<RootFamilyStickers />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/confusable-letter-contrast"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<ConfusableLetterContrast />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/letters/letter-sound-match"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<LetterSoundMatch />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/letters/letter-tracing-trail"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<LetterTracingTrail />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/letters/letter-sky-catcher"
            element={
              <ProtectedRoute>
                <AppLayout>{withAnimatedPage(<LetterSkyCatcher />, 'app')}</AppLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<PublicLayout>{withAnimatedPage(<NotFound />, 'public')}</PublicLayout>} />
        </Routes>
      </Suspense>
    </>
  );
}
