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
import { Portfolio, MockInterview, Settings } from './misc';
import { ResumeBuilder } from './ResumeBuilder';
import Projects from './Projects';
import GitHubTracker from './GitHubTracker';
import Profile from './Profile';
import CertsSkills from './CertsSkills';
import SemesterEngine from './SemesterEngine';

// Helper component for tabs
function TabbedView({ tabs, initialTab = 0 }) {
  const [activeIdx, setActiveIdx] = React.useState(initialTab);
  
  React.useEffect(() => {
    setActiveIdx(initialTab);
  }, [initialTab]);
  const ActiveComponent = tabs[activeIdx].component;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="tab-bar">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={`tab-btn ${activeIdx === idx ? 'active' : ''}`}
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
    { label: 'Tasks', component: Tasks },
    { label: 'Timetable', component: Timetable },
  ]} />;
}

export function StudySpace() {
  return <TabbedView tabs={[
    { label: 'Notes', component: Notes },
    { label: 'Focus Timer', component: FocusTimer },
  ]} />;
}

export function AcademicsHub() {
  return <TabbedView tabs={[
    { label: 'GPA & Grades', component: GPA },
    { label: 'Attendance', component: Attendance },
    { label: 'Notes', component: Notes },
    { label: 'Timetable', component: Timetable },
    { label: '✦ Semester Engine', component: SemesterEngine },
  ]} />;
}

export function CareerInternshipsHub() {
  return <TabbedView tabs={[
    { label: 'Career Intelligence', component: CareerPredictor },
    { label: 'Resume & ATS', component: ResumeBuilder },
    { label: 'Mock Interview', component: MockInterview },
    { label: 'Job Tracker', component: Internships },
  ]} />;
}



export function InterviewPrep() {
  return <TabbedView tabs={[
    { label: 'Resume & ATS', component: ResumeBuilder },
    { label: 'Mock Interview', component: MockInterview },
  ]} />;
}

export function ProjectsHub() {
  return <TabbedView tabs={[
    { label: 'Project Portfolio', component: Projects },
    { label: 'GitHub Activity', component: GitHubTracker },
  ]} />;
}

export function ProfileSettings({ activePanel }) {
  const initialIdx = activePanel === 'settings' ? 2 : 0;
  return <TabbedView tabs={[
    { label: 'Academic Identity', component: Profile },
    { label: 'Certs & Skills', component: CertsSkills },
    { label: 'Settings', component: Settings },
  ]} initialTab={initialIdx} />;
}
