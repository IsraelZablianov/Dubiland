import { lazy, Suspense, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell, MarketingShell } from '@/components/layout';
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
const LetterStorybook = lazy(() => import('@/pages/LetterStorybook'));
const RootFamilyStickers = lazy(() => import('@/pages/RootFamilyStickers'));
const ConfusableLetterContrast = lazy(() => import('@/pages/ConfusableLetterContrast'));
const LetterSoundMatch = lazy(() => import('@/pages/LetterSoundMatch'));
const LetterTracingTrail = lazy(() => import('@/pages/LetterTracingTrail'));
const LetterSkyCatcher = lazy(() => import('@/pages/LetterSkyCatcher'));

function RouteFallback() {
  return (
    <div className="route-fallback" aria-busy="true" aria-live="polite">
      <div className="route-fallback__panel">
        <span className="route-fallback__spinner" aria-hidden="true" />
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

          {/* App shell — authenticated profile + game routes */}
          <Route
            path="/profiles"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<ProfilePicker />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<Home />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<ParentDashboard />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/counting-picnic"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<CountingPicnic />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/more-or-less-market"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<MoreOrLessMarket />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/shape-safari"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<ShapeSafari />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/numbers/number-line-jumps"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<NumberLineJumps />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/colors/color-garden"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<ColorGarden />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/picture-to-word-builder"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<PictureToWordBuilder />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/sight-word-sprint"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<SightWordSprint />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/decodable-micro-stories"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<DecodableMicroStories />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/interactive-handbook"
            element={
              <ProtectedRoute>
                <AppShell><InteractiveHandbook /></AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/letter-storybook"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<LetterStorybook />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/root-family-stickers"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<RootFamilyStickers />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/reading/confusable-letter-contrast"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<ConfusableLetterContrast />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/letters/letter-sound-match"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<LetterSoundMatch />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/letters/letter-tracing-trail"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<LetterTracingTrail />, 'app')}</AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/games/letters/letter-sky-catcher"
            element={
              <ProtectedRoute>
                <AppShell>{withAnimatedPage(<LetterSkyCatcher />, 'app')}</AppShell>
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
