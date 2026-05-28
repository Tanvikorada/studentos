import React, { useState } from 'react';

// Import all original panels
import Tasks from './Tasks';
import Timetable from './Timetable';
import Notes from './Notes';
import FocusTimer from './FocusTimer';
import GPA from './GPA';
import Attendance from './Attendance';
import CareerPredictor from './CareerPredictor';
import Internships from './Internships';
import { MarketTrends, ResumeBuilder, Portfolio, MockInterview, Settings } from './misc';
import Projects from './Projects';
import GitHubTracker from './GitHubTracker';
import Profile from './Profile';
import CertsSkills from './CertsSkills';

// Helper component for tabs
function TabbedView({ tabs, initialTab = 0 }) {
  const [activeIdx, setActiveIdx] = React.useState(initialTab);
  
  React.useEffect(() => {
    setActiveIdx(initialTab);
  }, [initialTab]);
  const ActiveComponent = tabs[activeIdx].component;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, padding: '0 0 16px 0', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`btn ${activeIdx === idx ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveIdx(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <ActiveComponent />
      </div>
    </div>
  );
}

export function PlannerHub() {
  return <TabbedView tabs={[
    { label: 'Tasks & To-Do', component: Tasks },
    { label: 'Timetable', component: Timetable }
  ]} />;
}

export function StudySpace() {
  return <TabbedView tabs={[
    { label: 'Notes', component: Notes },
    { label: 'Focus Timer', component: FocusTimer }
  ]} />;
}

export function AcademicsHub() {
  return <TabbedView tabs={[
    { label: 'GPA Calculator', component: GPA },
    { label: 'Attendance', component: Attendance }
  ]} />;
}

export function CareerInternshipsHub() {
  return <TabbedView tabs={[
    { label: 'Career Predictor', component: CareerPredictor },
    { label: 'Internships', component: Internships },
    { label: 'Market Trends', component: MarketTrends }
  ]} />;
}

export function ProjectsHub() {
  return <TabbedView tabs={[
    { label: 'Projects', component: Projects },
    { label: 'Portfolio', component: Portfolio },
    { label: 'GitHub Tracker', component: GitHubTracker }
  ]} />;
}

export function InterviewPrep() {
  return <TabbedView tabs={[
    { label: 'Resume Builder', component: ResumeBuilder },
    { label: 'Mock Interview', component: MockInterview }
  ]} />;
}

export function ProfileSettings({ activePanel }) {
  const initialIdx = activePanel === 'settings' ? 2 : 0;
  return <TabbedView tabs={[
    { label: 'Profile', component: Profile },
    { label: 'Certs & Skills', component: CertsSkills },
    { label: 'Settings', component: Settings }
  ]} initialTab={initialIdx} />;
}
