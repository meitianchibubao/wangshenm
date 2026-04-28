import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Grid2X2,
  Info,
  Plus,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  X
} from 'lucide-react';
import './styles.css';

const cases = [
  {
    id: 'case-1',
    title: '交通违法处罚复议',
    applicant: '张宏',
    respondent: '某区公安分局',
    behavior: '行政处罚',
    date: '2026-04-27',
    precheck: {
      status: 'accepted',
      label: '初步判断可受理',
      summary: '当前信息和材料未发现明显受理风险。',
      blockers: [],
      materialIssues: [
        { level: '建议补充', name: '执法记录或现场照片', reason: '用于支撑处罚事实是否清楚。' }
      ],
      predictions: [
        { result: '存在撤销或变更可能', likelihood: '中', reason: '处罚事实与证据链存在可审查空间。' },
        { result: '维持原行政行为', likelihood: '中低', reason: '如执法证据完整，维持可能上升。' }
      ],
      suggestions: ['补充处罚决定书原件照片', '说明对处罚事实不认可的具体理由']
    }
  },
  {
    id: 'case-2',
    title: '市场监管处罚复议',
    applicant: '广州某商贸有限公司',
    respondent: '某区市场监督管理局',
    behavior: '行政处罚',
    date: '2026-04-18',
    precheck: {
      status: 'accepted',
      label: '初步判断可受理',
      summary: '当前主体、期限和基础材料基本符合要求。',
      blockers: [],
      materialIssues: [],
      predictions: [
        { result: '维持原行政行为可能较高', likelihood: '中高', reason: '现有材料尚不足以证明处罚依据明显不当。' }
      ],
      suggestions: ['补充进货票据、整改证明或处罚幅度过重的说明']
    }
  },
  {
    id: 'case-3',
    title: '信息公开答复复议',
    applicant: '李敏',
    respondent: '某街道办事处',
    behavior: '政府信息公开答复',
    date: '2026-04-09',
    precheck: {
      status: 'materials',
      label: '材料不足',
      summary: '缺少关键行政行为文书，暂不能稳定判断复议请求和答复内容是否匹配。',
      blockers: [],
      materialIssues: [
        { level: '必须补充', name: '信息公开答复书', reason: '用于确认被复议行政行为的具体内容。' },
        { level: '建议补充', name: '信息公开申请材料', reason: '用于核对申请事项和答复范围。' },
        { level: '建议补充', name: '送达凭证', reason: '用于辅助判断申请期限。' }
      ],
      predictions: [],
      suggestions: ['先上传信息公开答复书，再重新进行智能预审']
    }
  },
  {
    id: 'case-4',
    title: '同一处罚事项复议',
    applicant: '王强',
    respondent: '某市交通运输局',
    behavior: '行政处罚',
    date: '2026-02-10',
    precheck: {
      status: 'risk',
      label: '存在不予受理风险',
      summary: '当前信息显示可能已就同一事项向法院提起行政诉讼。',
      blockers: [
        { name: '同一事项已提起行政诉讼', reason: '该情形可能影响行政复议受理。' }
      ],
      materialIssues: [],
      predictions: [],
      suggestions: ['核实法院是否已经立案', '如未起诉或已撤诉，返回修改相关选项', '必要时咨询复议机关窗口']
    }
  }
];

function canPredict(precheck) {
  return precheck.status === 'accepted' && precheck.predictions.length > 0;
}

function getMaterials(selectedCase) {
  const materialNames = selectedCase.precheck.materialIssues.map((item) => item.name);
  const missingOriginal = materialNames.some((name) => name.includes('答复书') || name.includes('行政行为文书'));

  return [
    { title: '复议申请书', required: false, uploaded: true },
    {
      title: '原行政行为文书',
      required: true,
      uploaded: !missingOriginal,
      warning: true,
      removable: !missingOriginal,
      addMore: !missingOriginal
    },
    {
      title: '其他证据材料',
      required: false,
      uploaded: selectedCase.precheck.status === 'accepted',
      warning: true,
      addMore: true
    }
  ];
}

function HeaderProgress({ onBack }) {
  const steps = ['申请人信息', '被申请人信息', '行政行为信息', '申请材料'];

  return (
    <header className="hero">
      <button className="back-button" aria-label="返回" onClick={onBack}>
        <ArrowLeft size={22} />
      </button>
      <h1>申请复议</h1>
      <div className="service-float service-grid">
        <Grid2X2 size={22} />
      </div>
      <div className="service-float service-lang">
        <span>文</span>
      </div>

      <div className="progress-wrap">
        <div className="progress-line" />
        {steps.map((step, index) => (
          <div className={`step step-${index + 1} active`} key={step}>
            <span className="dot" />
            <span className="step-label">{step}</span>
          </div>
        ))}
      </div>
    </header>
  );
}

function CaseListPage({ onSelect }) {
  return (
    <main className="phone-page list-page">
      <section className="list-hero">
        <h1>复议网申预审</h1>
        <p>选择一个演示案件，进入材料页后查看智能预审结果。</p>
      </section>

      <section className="case-list">
        {cases.map((item) => (
          <button className="case-card" key={item.id} onClick={() => onSelect(item)}>
            <div className="case-card-head">
              <div>
                <h2>{item.title}</h2>
                <p>{item.respondent}</p>
              </div>
              <span className="case-tag neutral">待预审</span>
            </div>

            <div className="case-meta">
              <span>
                <FileText size={14} />
                {item.behavior}
              </span>
              <span>
                <Clock size={14} />
                {item.date}
              </span>
            </div>

            <div className="case-result muted">
              <span>案件要点</span>
              <strong>{item.behavior} · {item.applicant}</strong>
            </div>
          </button>
        ))}
      </section>
    </main>
  );
}

function MaterialCard({ item }) {
  return (
    <section className="material-card">
      <div className="card-title-row">
        <h2>
          {item.required && <span className="required">*</span>}
          {item.title}
        </h2>
        {item.warning && <Info className="info-icon dark" size={18} />}
      </div>

      <div className="upload-row">
        {item.uploaded && (
          <div className="file-preview">
            <div className={`paper-thumb ${item.removable ? 'doc-thumb' : ''}`}>
              {item.removable && <button className="remove-file" aria-label="删除材料">×</button>}
              <div className="paper-lines">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="file-caption">
              <FileText size={14} />
              <span>已上传</span>
            </div>
          </div>
        )}
        {(!item.uploaded || item.addMore) && (
          <button className="upload-box" aria-label={`上传${item.title}`}>
            <Plus size={62} strokeWidth={1.6} />
          </button>
        )}
      </div>
    </section>
  );
}

function PrecheckDock({ onOpen }) {
  return (
    <div className="precheck-mini-wrap">
      <button className="precheck-mini" onClick={onOpen} aria-label="打开智能预审">
        <ScanSearch size={23} />
      </button>
      <button className="precheck-tip" onClick={onOpen}>
        智能预审
      </button>
    </div>
  );
}

function SectionList({ title, icon, items, emptyText, renderItem }) {
  if (!items.length && !emptyText) return null;

  return (
    <section className="review-section">
      <div className="review-section-title">
        {icon}
        <h3>{title}</h3>
      </div>
      {items.length ? (
        <div className="review-list">
          {items.map((item, index) => (
            <div className="review-list-item" key={`${title}-${index}`}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-review">{emptyText}</p>
      )}
    </section>
  );
}

function AcceptanceReview({ precheck }) {
  const hasBlockers = precheck.blockers.length > 0;
  const hasMaterialIssues = precheck.materialIssues.length > 0;
  const hasRequiredMaterialIssues = precheck.materialIssues.some((item) => item.level === '必须补充');

  return (
    <section className="review-section">
      <div className="review-section-title">
        <FileText size={18} />
        <h3>受理条件与材料</h3>
      </div>

      <div className="check-list">
        {hasBlockers ? (
          precheck.blockers.map((item, index) => (
            <div className="check-row danger" key={`blocker-${index}`}>
              <AlertCircle size={17} />
              <div>
                <strong>{item.name}</strong>
                <p>{item.reason}</p>
              </div>
            </div>
          ))
        ) : hasRequiredMaterialIssues ? (
          <div className="check-row pending">
            <AlertCircle size={17} />
            <div>
              <strong>受理条件待材料补齐后确认</strong>
              <p>当前缺少关键材料，补齐后才能更准确判断是否符合受理条件。</p>
            </div>
          </div>
        ) : (
          <div className="check-row ok">
            <CheckCircle2 size={17} />
            <div>
              <strong>未发现明显受理风险</strong>
              <p>仍以复议机关正式审查结果为准。</p>
            </div>
          </div>
        )}

        {hasMaterialIssues ? (
          precheck.materialIssues.map((item, index) => (
            <div className="check-row material" key={`material-${index}`}>
              <FileText size={17} />
              <div>
                <span className={`level ${item.level === '必须补充' ? 'danger' : 'warning'}`}>{item.level}</span>
                <strong>{item.name}</strong>
                <p>{item.reason}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="check-row ok">
            <CheckCircle2 size={17} />
            <div>
              <strong>材料未发现明显缺项</strong>
              <p>可继续提交，也可根据实际情况补充证据。</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PredictionSection({ precheck }) {
  const predictionEnabled = canPredict(precheck);
  const [topPrediction, ...otherPredictions] = precheck.predictions;

  if (!predictionEnabled) {
    return (
      <section className="prediction-card blocked">
        <div className="analysis-title">
          <AlertCircle size={18} />
          <span>{precheck.status === 'materials' ? '补齐材料后再评估复议结果' : '处理受理风险后再评估复议结果'}</span>
        </div>
        <strong>{precheck.status === 'materials' ? '当前缺少关键材料' : '当前存在受理风险'}</strong>
        <p>{precheck.status === 'materials' ? '请先补充影响判断的材料，补充后可重新预审。' : '请先核实并修改可能影响受理的信息，修改后可重新预审。'}</p>
      </section>
    );
  }

  return (
    <section className="prediction-card">
      <div className="analysis-title">
        <ShieldCheck size={18} />
        <span>可能的复议结果</span>
      </div>
      <strong>{topPrediction.result}</strong>
      <p>{topPrediction.reason}</p>
      <div className="forecast-grid">
        <div>
          <span>主要可能</span>
          <b>{topPrediction.result}</b>
        </div>
        <div>
          <span>把握程度</span>
          <b>{topPrediction.likelihood}</b>
        </div>
      </div>

      {otherPredictions.length > 0 && (
        <div className="alternate-predictions">
          <h4>其他可能</h4>
          {otherPredictions.map((item, index) => (
            <div key={`prediction-${index}`}>
              <strong>{item.result}</strong>
              <p>{item.reason} 把握程度：{item.likelihood}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SmartReviewSheet({ open, selectedCase, onClose, onReviewed }) {
  const [status, setStatus] = useState('loading');
  const precheck = selectedCase.precheck;

  const rerunPrecheck = () => {
    setStatus('loading');
    window.setTimeout(() => {
      setStatus('result');
      onReviewed?.();
    }, 650);
  };

  useEffect(() => {
    if (!open) return;
    setStatus('loading');
    const timer = window.setTimeout(() => {
      setStatus('result');
      onReviewed?.();
    }, 650);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  if (status === 'loading') {
    return (
      <div className="sheet-mask">
        <section className="precheck-sheet compact">
          <div className="scan-ring">
            <RefreshCw size={26} />
          </div>
          <h2>正在智能预审</h2>
      <p>正在核验受理条件、材料情况和复议结果。</p>
          <div className="scan-bar">
            <span />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="sheet-mask" onClick={onClose}>
      <section className="precheck-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title-row">
          <h2>智能预审结果</h2>
          <button onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className={`precheck-hero ${precheck.status}`}>
          <span className="smart-icon">
            <Bot size={21} />
          </span>
          <div>
            <strong>{precheck.label}</strong>
            <p>{precheck.summary}</p>
          </div>
        </div>

        <AcceptanceReview precheck={precheck} />
        <PredictionSection precheck={precheck} />

        <SectionList
          title="处理建议"
          icon={<CheckCircle2 size={18} />}
          items={precheck.suggestions}
          emptyText="暂无额外处理建议。"
          renderItem={(item, index) => (
            <div className="suggestion-row">
              <span>{index + 1}</span>
              <p>{item}</p>
            </div>
          )}
        />

        <p className="official-note">以上为智能辅助分析，最终以复议机关审查结果为准。</p>

        <div className="smart-actions sticky">
          <button className="outline-small" onClick={onClose}>
            返回
          </button>
          <button className="primary-small" onClick={rerunPrecheck}>
            重新生成
          </button>
        </div>
      </section>
    </div>
  );
}

function ConfirmModal({ open, onClose, onPrecheck, hasPrechecked }) {
  if (!open) return null;

  return (
    <div className="modal-mask">
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          <X size={18} />
        </button>
        <div className="modal-icon">
          <AlertCircle size={28} />
        </div>
        <h2>{hasPrechecked ? '确认提交申请' : '建议先进行智能预审'}</h2>
        <p>
          {hasPrechecked
            ? '提交后将进入复议机关审查流程，最终结果以复议机关处理为准。'
            : '智能预审可帮助检查是否需要补正、是否存在受理风险。你也可以跳过预审，直接提交申请。'}
        </p>
        <div className="modal-actions">
          <button className="modal-outline" onClick={hasPrechecked ? onClose : onPrecheck}>
            {hasPrechecked ? '返回' : '先预审'}
          </button>
          <button className="modal-primary" onClick={onClose}>
            {hasPrechecked ? '提交申请' : '直接提交'}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [selectedCase, setSelectedCase] = useState(null);
  const [precheckOpen, setPrecheckOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasPrechecked, setHasPrechecked] = useState(false);
  const materials = useMemo(() => (selectedCase ? getMaterials(selectedCase) : []), [selectedCase]);

  if (!selectedCase) {
    return <CaseListPage onSelect={setSelectedCase} />;
  }

  return (
    <main className="phone-page">
      <HeaderProgress onBack={() => {
        setSelectedCase(null);
        setHasPrechecked(false);
      }} />

      <div className="content">
        <section className="current-case">
          <span className="case-tag neutral">待查看预审</span>
          <h2>{selectedCase.title}</h2>
          <p>{selectedCase.applicant} · {selectedCase.respondent}</p>
        </section>

        {materials.map((item) => (
          <MaterialCard item={item} key={item.title} />
        ))}
      </div>

      <PrecheckDock onOpen={() => setPrecheckOpen(true)} />

      <footer className="bottom-bar">
        <button className="prev-btn">上一步</button>
        <button className="submit-btn" onClick={() => setModalOpen(true)}>
          提交
          <ChevronRight size={18} />
        </button>
      </footer>

      <SmartReviewSheet
        open={precheckOpen}
        selectedCase={selectedCase}
        onClose={() => setPrecheckOpen(false)}
        onReviewed={() => setHasPrechecked(true)}
      />
      <ConfirmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        hasPrechecked={hasPrechecked}
        onPrecheck={() => {
          setModalOpen(false);
          setPrecheckOpen(true);
        }}
      />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
