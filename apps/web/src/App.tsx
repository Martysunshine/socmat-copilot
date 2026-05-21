import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import CaseList from './pages/CaseList'
import CreateCase from './pages/CreateCase'
import CaseDetail from './pages/CaseDetail'
import SigmaRules from './pages/SigmaRules'
import SigmaRuleDetail from './pages/SigmaRuleDetail'
import YaraRulesPage from './pages/YaraRulesPage'
import Reports from './pages/Reports'
import MCPStatus from './pages/MCPStatus'
import SplunkPage from './pages/SplunkPage'
import ElasticPage from './pages/ElasticPage'

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
          <Route path="yara" element={<YaraRulesPage />} />
          <Route path="reports" element={<Reports />} />
          <Route path="mcp" element={<MCPStatus />} />
          <Route path="splunk" element={<SplunkPage />} />
          <Route path="elastic" element={<ElasticPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
