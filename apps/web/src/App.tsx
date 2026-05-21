import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CaseList from './pages/CaseList'
import CreateCase from './pages/CreateCase'
import CaseDetail from './pages/CaseDetail'
import SigmaRules from './pages/SigmaRules'
import SigmaRuleDetail from './pages/SigmaRuleDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<CaseList />} />
          <Route path="cases/new" element={<CreateCase />} />
          <Route path="cases/:id" element={<CaseDetail />} />
          <Route path="sigma" element={<SigmaRules />} />
          <Route path="sigma/:ruleId" element={<SigmaRuleDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
