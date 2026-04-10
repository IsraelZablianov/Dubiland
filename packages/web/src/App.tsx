import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ChildPlayShell, MarketingShell, ParentShell } from '@/components/layout';
import { MascotIllustration } from '@/components/illustrations';
import { AnimatedPage, FloatingElement, SuccessCelebration } from '@/components/motion';
import { ScrollToTop } from '@/components/routing/ScrollToTop';

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
const RouteMetadataManager = lazy(async () => {
  const module = await import('@/seo/RouteMetadataManager');
  return { default: module.RouteMetadataManager };
});

function RouteFallback() {
  return (
    <div className="route-fallback" aria-busy="true" aria-live="polite">
      <span className="route-fallback__halo" aria-hidden="true" />
      <div className="route-fallback__panel">
        <FloatingElement className="route-fallback__mascot-wrap" durationMs={2800}>
          <MascotIllustration variant="loading" size={132} />
        </FloatingElement>
        <SuccessCelebration dense className="route-fallback__celebration" />
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
      <Suspense fallback={null}>
        <RouteMetadataManager />
      </Suspense>

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public marketing pages */}
          <Route path="/" element={<MarketingShell>{withAnimatedPage(<Landing />, 'public')}</MarketingShell>} />
          <Route path="/about" element={<MarketingShell>{withAnimatedPage(<About />, 'public')}</MarketingShell>} />
          <Route path="/parents" element={<MarketingShell>{withAnimatedPage(<Parents />, 'public')}</MarketingShell>} />
          <Route path="/parents/faq" element={<MarketingShell>{withAnimatedPage(<ParentsFaq />, 'public')}</MarketingShell>} />
          <Route path="/terms" element={<MarketingShell>{withAnimatedPage(<Terms />, 'public')}</MarketingShell>} />
          <Route path="/privacy" element={<MarketingShell>{withAnimatedPage(<Privacy />, 'public')}</MarketingShell>} />
          <Route path="/letters" element={<MarketingShell>{withAnimatedPage(<TopicPillar topic="letters" />, 'public')}</MarketingShell>} />
          <Route path="/numbers" element={<MarketingShell>{withAnimatedPage(<TopicPillar topic="numbers" />, 'public')}</MarketingShell>} />
          <Route path="/reading" element={<MarketingShell>{withAnimatedPage(<TopicPillar topic="reading" />, 'public')}</MarketingShell>} />

          {/* Login — public header/footer */}
          <Route path="/login" element={<MarketingShell>{withAnimatedPage(<Login />, 'public')}</MarketingShell>} />

          {/* App pages — app header with child info + navigation */}
          <Route
            path="/profiles"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<ProfilePicker />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<Home />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <ProtectedRoute>
                <ParentShell>{withAnimatedPage(<ParentDashboard />, 'app')}</ParentShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/counting-picnic"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<CountingPicnic />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/more-or-less-market"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<MoreOrLessMarket />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/shape-safari"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<ShapeSafari />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/number-line-jumps"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<NumberLineJumps />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/colors/color-garden"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<ColorGarden />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/picture-to-word-builder"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<PictureToWordBuilder />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/sight-word-sprint"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<SightWordSprint />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/decodable-micro-stories"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<DecodableMicroStories />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/interactive-handbook"
            element={
              <ProtectedRoute>
                <ChildPlayShell><InteractiveHandbook /></ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/root-family-stickers"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<RootFamilyStickers />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/confusable-letter-contrast"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<ConfusableLetterContrast />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/letters/letter-sound-match"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<LetterSoundMatch />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/letters/letter-tracing-trail"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<LetterTracingTrail />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/letters/letter-sky-catcher"
            element={
              <ProtectedRoute>
                <ChildPlayShell>{withAnimatedPage(<LetterSkyCatcher />, 'app')}</ChildPlayShell>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<MarketingShell>{withAnimatedPage(<NotFound />, 'public')}</MarketingShell>} />
        </Routes>
      </Suspense>
    </>
  );
}
