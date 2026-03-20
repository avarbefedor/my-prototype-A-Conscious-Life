import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { NowPage } from './pages/NowPage';
import { EveningPage } from './pages/EveningPage';
import { FeedPage } from './pages/FeedPage';
import { InsightsPage } from './pages/InsightsPage';
import { ProfilePage } from './pages/ProfilePage';
import { DayDetailPage } from './pages/DayDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: NowPage },
      { path: 'evening', Component: EveningPage },
      { path: 'feed', Component: FeedPage },
      { path: 'insights', Component: InsightsPage },
      { path: 'profile', Component: ProfilePage },
      { path: 'day/:date', Component: DayDetailPage },
      { path: '*', Component: NowPage },
    ],
  },
]);
