// Importações do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { 
    getFirestore, collection, doc, addDoc, getDocs, onSnapshot, 
    query, orderBy, where, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp, setDoc 
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

// --- CONFIGURAÇÃO FIREBASE --------------------------------------------------
// IMPORTANTE: Substitua os valores "SUA_..." pelas suas chaves reais do Firebase.
// Eu removi suas chaves por segurança.
const firebaseConfig = {
  apiKey: "AIzaSyDd5jiOWaLS0FqcHgQCneBEyL-0TRMLmG4",
  authDomain: "studio-carla-borges.firebaseapp.com",
  projectId: "studio-carla-borges",
  storageBucket: "studio-carla-borges.firebasestorage.app",
  messagingSenderId: "898802196256",
  appId: "1:898802196256:web:fafcc7e833ed1509278145"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- ÍCONES SVG -------------------------------------------------------------
const ICONS = {
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cor-principal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="action-icon"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    delete: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cor-perigo)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="action-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    receipt: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0dcaf0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="action-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    pay: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cor-sucesso)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="action-icon"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`
};

// --- ESTADO DA APLICAÇÃO ----------------------------------------------------
const state = {
    alunos: [],
    aulas: [],
    planos: [],
    formasPagamento: [],
    mensalidades: [],
    caixa: [],
    presencas: {}, // { "YYYY-MM-DD_aulaId": { alunoId1: true, alunoId2: false, ... } }
    filtroFinanceiro: 'todos',
    firestoreListeners: [], // Para guardar os unsubscribers
};

// --- ELEMENTOS DO DOM -------------------------------------------------------
const DOM = {
    initialLoading: document.getElementById('initial-loading'),
    loginSection: document.getElementById('login-section'),
    loginForm: document.getElementById('login-form'),
    loginError: document.getElementById('login-error'),
    mainAppSection: document.getElementById('main-app-section'),
    userInfo: document.getElementById('user-info'),
    userEmail: document.getElementById('user-email'),
    logoutButton: document.getElementById('logout-button'),
    diaSemanaTitulo: document.getElementById('dia-da-semana-titulo'),
    programacaoDia: document.getElementById('programacao-do-dia'),
    tabelaFinanceiro: document.getElementById('tabela-financeiro'),
    filtrosFinanceiro: document.getElementById('filtros-financeiro'),
    btnGerarMensalidades: document.getElementById('btn-gerar-mensalidades'),
    resumoReceitaAulas: document.getElementById('resumo-receita-aulas'),
    resumoReceitaMatriculas: document.getElementById('resumo-receita-matriculas'),
    resumoOutrasEntradas: document.getElementById('resumo-outras-entradas'),
    resumoDespesas: document.getElementById('resumo-despesas'),
    resumoBalanco: document.getElementById('resumo-balanco'),
    resumoAReceber: document.getElementById('resumo-a-receber'),
    alertBadgeAReceber: document.getElementById('alert-badge-a-receber'),
    mesAnoFinanceiro: document.getElementById('mes-ano-financeiro'),
    formAluno: document.getElementById('form-aluno'),
    alunosCardTitle: document.getElementById('alunos-card-title'),
    alunoMatriculaValor: document.getElementById('aluno-matricula-valor'),
    alunoMatriculaIsento: document.getElementById('aluno-matricula-isento'),
    tabelaAlunos: document.getElementById('tabela-alunos'),
    selectTurmaAluno: document.getElementById('aluno-turma'),
    selectPlanoAluno: document.getElementById('aluno-plano'),
    selectBolsaAluno: document.getElementById('aluno-bolsa'),
    btnCancelarEdicaoAluno: document.getElementById('btn-cancelar-edicao-aluno'),
    formAula: document.getElementById('form-aula'),
    tabelaAulas: document.getElementById('tabela-aulas'),
    aulaVagas: document.getElementById('aula-vagas'),
    aulaDiasSemana: document.getElementById('aula-dias-semana'),
    btnCancelarEdicaoAula: document.getElementById('btn-cancelar-edicao-aula'),
    formPlano: document.getElementById('form-plano'),
    planoValorParcela: document.getElementById('plano-valor-parcela'),
    planoMeses: document.getElementById('plano-meses'),
    planoDesconto: document.getElementById('plano-desconto'),
    planoValorTotalCalculado: document.getElementById('plano-valor-total-calculado'),
    tabelaPlanos: document.getElementById('tabela-planos'),
    btnCancelarEdicaoPlano: document.getElementById('btn-cancelar-edicao-plano'),
    formFormasPagamento: document.getElementById('form-formas-pagamento'),
    tabelaFormasPagamento: document.getElementById('tabela-formas-pagamento'),
    btnCancelarEdicaoFormaPagamento: document.getElementById('btn-cancelar-edicao-forma-pagamento'),
    modalPagamento: new bootstrap.Modal(document.getElementById('modal-pagamento')),
    formPagamentoLancamento: document.getElementById('form-pagamento-lancamento'),
    pagamentoValor: document.getElementById('pagamento-valor'),
    pagamentoDesconto: document.getElementById('pagamento-desconto'),
    pagamentoValorFinal: document.getElementById('pagamento-valor-final'),
    selectFormaPagamentoModal: document.getElementById('pagamento-forma'),
    confirmationModal: new bootstrap.Modal(document.getElementById('confirmationModal')),
    confirmActionBtn: document.getElementById('confirmActionBtn'),
    toast: new bootstrap.Toast(document.getElementById('liveToast')),
    formCaixa: document.getElementById('form-caixa'),
    tabelaCaixa: document.getElementById('tabela-caixa'),
    btnCancelarEdicaoCaixa: document.getElementById('btn-cancelar-edicao-caixa'),
    relatorioMes: document.getElementById('relatorio-mes'),
    relatorioAno: document.getElementById('relatorio-ano'),
    btnGerarBalancete: document.getElementById('btn-gerar-balancete'),
    btnGerarRelatorioInadimplencia: document.getElementById('btn-gerar-relatorio-inadimplencia'),
    tabelaPrevisao: document.getElementById('tabela-previsao'),
};

// --- FUNÇÕES AUXILIARES ----------------------------------------------------

const showToast = (message, title = "Sucesso!", type = 'success') => {
    const toastTitle = document.getElementById('toastTitle');
    const toastBody = document.getElementById('toastBody');
    const toastHeader = document.querySelector('#liveToast .toast-header');
    const toastRect = document.querySelector('#liveToast .toast-header svg rect');
    
    toastTitle.textContent = title;
    toastBody.textContent = message;
    
    toastHeader.classList.remove('bg-success', 'bg-danger', 'text-white');

    if (type === 'success') {
        toastHeader.classList.add('bg-success', 'text-white');
        toastRect.setAttribute('fill', 'var(--cor-sucesso)');
    } else {
        toastHeader.classList.add('bg-danger', 'text-white');
        toastRect.setAttribute('fill', 'var(--cor-perigo)');
    }

    DOM.toast.show();
};

const showConfirmation = (title, body, onConfirm) => {
    document.getElementById('confirmationModalTitle').textContent = title;
    document.getElementById('confirmationModalBody').textContent = body;
    
    const newConfirmBtn = DOM.confirmActionBtn.cloneNode(true);
    DOM.confirmActionBtn.parentNode.replaceChild(newConfirmBtn, DOM.confirmActionBtn);
    DOM.confirmActionBtn = newConfirmBtn;
    
    DOM.confirmActionBtn.addEventListener('click', () => {
        onConfirm();
        DOM.confirmationModal.hide();
    }, { once: true });

    DOM.confirmationModal.show();
};

const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // Adicionado timeZone UTC para consistência
};

const formatDateISO = (date) => {
     return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

const formatCurrency = (value) => (value != null ? value : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


const resetForm = (formElement, btnCancel, cardTitleElement, originalTitle) => {
    formElement.reset();
    formElement.querySelector('input[type="hidden"]').value = '';
    if (btnCancel) btnCancel.style.display = 'none';
    if (cardTitleElement) cardTitleElement.textContent = originalTitle;
    const submitButton = formElement.querySelector('button[type="submit"]');
    if (submitButton && submitButton.textContent.includes('Atualizar')) {
        submitButton.textContent = submitButton.textContent.replace('Atualizar', 'Salvar');
    }
    if (formElement.id === 'form-aluno') {
        DOM.alunoMatriculaIsento.checked = false;
        DOM.alunoMatriculaValor.disabled = false;
        DOM.alunoMatriculaValor.value = '100.00';
        DOM.selectBolsaAluno.value = "0";
    }
     if (formElement.id === 'form-plano') {
        DOM.planoMeses.value = 1;
        appLogic.planos.calcularValorTotalPlanoForm();
    }
    if (formElement.id === 'form-caixa') {
        formElement.querySelector('#caixa-data').valueAsDate = new Date();
    }
};

// Função para aplicar máscara de telefone
const applyPhoneMask = (input) => {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = value.slice(0, 15); // Limita o tamanho
    });
};

// --- FUNÇÕES DE RENDERIZAÇÃO ----------------------------------------------

const calcularERenderizarResumoFinanceiro = () => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    DOM.mesAnoFinanceiro.textContent = hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());

    // Filtra transações do mês atual
    const mensalidadesPagasMes = state.mensalidades.filter(m => {
        const dataPgto = m.dataPagamento ? new Date(m.dataPagamento.seconds * 1000) : null;
        return m.status === 'Pago' && dataPgto && dataPgto.getMonth() === mesAtual && dataPgto.getFullYear() === anoAtual;
    });
    const caixaMes = state.caixa.filter(c => {
        const dataLanc = new Date(c.data.seconds * 1000);
        return dataLanc.getMonth() === mesAtual && dataLanc.getFullYear() === anoAtual;
    });
    const mensalidadesAReceberMes = state.mensalidades.filter(m => {
         const dataVenc = new Date(m.dataVencimento.seconds * 1000);
        return m.status !== 'Pago' && dataVenc.getMonth() === mesAtual && dataVenc.getFullYear() === anoAtual;
    });


    const receitaAulas = mensalidadesPagasMes
        .filter(m => m.tipo === 'mensalidade' || !m.tipo) // !m.tipo para retrocompatibilidade
        .reduce((acc, m) => acc + (m.valorFinal || 0), 0);
    
    const receitaMatriculas = mensalidadesPagasMes
        .filter(m => m.tipo === 'matricula')
        .reduce((acc, m) => acc + (m.valorFinal || 0), 0);
        
    const outrasEntradas = caixaMes.filter(c => c.tipo === 'entrada').reduce((acc, c) => acc + c.valor, 0);
    const despesas = caixaMes.filter(c => c.tipo === 'saida').reduce((acc, c) => acc + c.valor, 0);
    const aReceber = mensalidadesAReceberMes.reduce((acc, m) => acc + (m.valorPlano || 0), 0);
    const balanco = (receitaAulas + receitaMatriculas + outrasEntradas) - despesas;
    
    // Verifica se há atrasados no mês atual para o badge de alerta
    const haAtrasadosNoMes = mensalidadesAReceberMes.some(m => new Date(m.dataVencimento.seconds * 1000) < hoje);
    DOM.alertBadgeAReceber.style.display = haAtrasadosNoMes ? 'inline-block' : 'none';

    DOM.resumoReceitaAulas.textContent = formatCurrency(receitaAulas);
    DOM.resumoReceitaMatriculas.textContent = formatCurrency(receitaMatriculas);
    DOM.resumoOutrasEntradas.textContent = formatCurrency(outrasEntradas);
    DOM.resumoDespesas.textContent = formatCurrency(despesas);
    DOM.resumoAReceber.textContent = formatCurrency(aReceber);
    DOM.resumoBalanco.textContent = formatCurrency(balanco);
    DOM.resumoBalanco.classList.toggle('text-danger', balanco < 0);
    DOM.resumoBalanco.classList.toggle('text-success', balanco >= 0);
};


const renderPainelDoDia = () => {
    const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const hoje = new Date();
    const hojeStr = formatDateISO(hoje);
    const diaDeHojeChave = dias[hoje.getDay()];
    DOM.diaSemanaTitulo.textContent = `${diasNomes[hoje.getDay()]}, ${hoje.toLocaleDateString('pt-BR')}`;
    
    const aulasDeHoje = state.aulas.filter(aula => aula.dias && aula.dias[diaDeHojeChave]).sort((a, b) => a.horario.localeCompare(b.horario));
    
    if (aulasDeHoje.length === 0) {
        DOM.programacaoDia.innerHTML = '<p class="text-center text-muted p-5">Nenhuma aula programada para hoje.</p>';
        return;
    }

    DOM.programacaoDia.innerHTML = aulasDeHoje.map(aula => {
        const alunosDaTurma = state.alunos.filter(aluno => aluno.turma === aula.nome);
        const presencaKey = `${hojeStr}_${aula.id}`;
        const presencasDoDia = state.presencas[presencaKey] || {};

        const listaAlunosHtml = alunosDaTurma.length > 0 
            ? alunosDaTurma.map(aluno => {
                const presente = presencasDoDia[aluno.id] === true;
                return `<li class="list-group-item d-flex justify-content-between align-items-center">
                            <span class="${presente ? 'aluno-presente' : ''}">${aluno.nome}</span>
                            <div class="form-check form-switch form-check-presenca">
                                <input class="form-check-input" type="checkbox" role="switch" id="presenca_${aula.id}_${aluno.id}" 
                                       data-aluno-id="${aluno.id}" data-aula-id="${aula.id}" data-data="${hojeStr}" 
                                       ${presente ? 'checked' : ''} onchange="window.app.aulas.marcarPresenca(this)">
                                <label class="form-check-label" for="presenca_${aula.id}_${aluno.id}">${presente ? 'Presente' : 'Ausente'}</label>
                            </div>
                        </li>`;
              }).join('') 
            : '<li class="list-group-item text-muted">Nenhum aluno matriculado nesta turma.</li>';
        
        return `<div class="card mb-3">
                    <div class="card-header d-flex justify-content-between">
                        <strong>${aula.nome}</strong>
                        <span>${aula.horario}</span>
                    </div>
                    <ul class="list-group list-group-flush">${listaAlunosHtml}</ul>
                </div>`;
    }).join('');
};

const renderTabelaFinanceiraAlunos = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dadosFiltrados = state.mensalidades.filter(m => {
        if (state.filtroFinanceiro === 'todos') return true;
        const vencimento = new Date(m.dataVencimento.seconds * 1000);
        const status = (m.status === 'Pago') ? 'pago' : (vencimento < hoje ? 'atrasado' : 'pendente');
        return status === state.filtroFinanceiro;
    });

    if (dadosFiltrados.length === 0) {
        DOM.tabelaFinanceiro.innerHTML = '<tr><td colspan="5" class="text-center p-4">Nenhuma mensalidade encontrada para este filtro.</td></tr>';
        return;
    }
    
    DOM.tabelaFinanceiro.innerHTML = dadosFiltrados.map(m => {
        const vencimento = new Date(m.dataVencimento.seconds * 1000);
        let status = m.status;
        let statusBadge = 'bg-warning text-dark';
        
        if (status !== 'Pago') {
            if(vencimento < hoje) {
                status = 'Atrasado';
                statusBadge = 'bg-danger text-white';
            } else {
                status = 'Pendente';
            }
        } else {
             statusBadge = 'bg-success text-white';
        }
        
        const botoesAcao = (m.status === 'Pago') 
            ? `<span onclick="window.app.financeiro.gerarRecibo('${m.id}')" title="Gerar Recibo">${ICONS.receipt}</span>`
            : `<span onclick="window.app.financeiro.abrirModalPagamento('${m.id}')" title="Dar Baixa / Pagar" class="d-flex align-items-center gap-1">${ICONS.pay} Pagar</span>`;

        return `<tr>
            <td>${m.alunoNome}</td>
            <td>${vencimento.toLocaleDateString('pt-BR')}</td>
            <td>${formatCurrency(m.valorPlano)}</td>
            <td><span class="badge ${statusBadge}">${status}</span></td>
            <td>${botoesAcao}</td>
        </tr>`;
    }).join('');
};

const renderTabelaCaixa = () => {
    if(state.caixa.length === 0) {
        DOM.tabelaCaixa.innerHTML = '<tr><td colspan="6" class="text-center p-4">Nenhum lançamento no caixa.</td></tr>';
        return;
    }
    DOM.tabelaCaixa.innerHTML = state.caixa.map(c => {
        const tipoClasse = c.tipo === 'entrada' ? 'text-success' : 'text-danger';
        return `
        <tr>
            <td>${c.descricao}</td>
            <td>${c.categoria || '-'}</td>
            <td>${formatDate(c.data)}</td>
            <td><span class="badge ${c.tipo === 'entrada' ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}">${c.tipo}</span></td>
            <td class="fw-bold ${tipoClasse}">${formatCurrency(c.valor)}</td>
            <td>
                <span onclick="window.app.caixa.editar('${c.id}')" title="Editar">${ICONS.edit}</span>
                <span onclick="window.app.caixa.deletar('${c.id}', '${c.descricao}')" title="Excluir">${ICONS.delete}</span>
            </td>
        </tr>
    `}).join('');
};


const renderTabelaAlunos = () => {
    if (state.alunos.length === 0) {
        DOM.tabelaAlunos.innerHTML = '<tr><td colspan="5" class="text-center p-4">Nenhum aluno cadastrado.</td></tr>';
        return;
    }
    DOM.tabelaAlunos.innerHTML = state.alunos.map(aluno => `
        <tr>
            <td>${aluno.nome}</td>
            <td>${aluno.plano}</td>
            <td>${aluno.bolsaPercentual || 0}%</td>
            <td>Dia ${aluno.diaVencimento}</td>
            <td>
                <span onclick="window.app.alunos.editar('${aluno.id}')" title="Editar">${ICONS.edit}</span>
                <span onclick="window.app.alunos.deletar('${aluno.id}', '${aluno.nome}')" title="Excluir">${ICONS.delete}</span>
            </td>
        </tr>
    `).join('');
};

const renderTabelaAulas = () => {
     if (state.aulas.length === 0) {
        DOM.tabelaAulas.innerHTML = '<tr><td colspan="5" class="text-center p-4">Nenhuma aula cadastrada.</td></tr>';
        return;
    }
    DOM.tabelaAulas.innerHTML = state.aulas.map(aula => {
        const dias = aula.dias ? Object.keys(aula.dias).filter(d => aula.dias[d]).map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') : 'N/D';
        const alunosMatriculados = state.alunos.filter(a => a.turma === aula.nome).length;
        const vagas = aula.vagas ? `${alunosMatriculados}/${aula.vagas}` : `${alunosMatriculados}/Ilimitado`;
        return `
            <tr>
                <td>${aula.nome}</td>
                <td>${aula.horario}</td>
                <td>${dias}</td>
                <td>${vagas}</td>
                <td>
                    <span onclick="window.app.aulas.editar('${aula.id}')" title="Editar">${ICONS.edit}</span>
                    <span onclick="window.app.aulas.deletar('${aula.id}', '${aula.nome}')" title="Excluir">${ICONS.delete}</span>
                </td>
            </tr>
        `;
    }).join('');
};

const renderTabelaPlanos = () => {
    DOM.tabelaPlanos.innerHTML = state.planos.map(plano => {
        const valorTotal = (plano.valorParcela || 0) * (plano.numeroMeses || 1);
        const valorTotalComDesconto = valorTotal * (1 - (plano.desconto || 0) / 100);
        return `
            <tr>
                <td>${plano.nome}</td>
                <td>${formatCurrency(plano.valorParcela)}</td>
                <td>${plano.numeroMeses}</td>
                <td>${plano.desconto || 0}%</td>
                <td>${formatCurrency(valorTotalComDesconto)}</td>
                <td>
                    <span onclick="window.app.planos.editar('${plano.id}')" title="Editar">${ICONS.edit}</span>
                    <span onclick="window.app.planos.deletar('${plano.id}', '${plano.nome}')" title="Excluir">${ICONS.delete}</span>
                </td>
            </tr>
        `
    }).join('');
};

const renderTabelaFormasPagamento = () => {
    DOM.tabelaFormasPagamento.innerHTML = state.formasPagamento.map(forma => `
        <tr>
            <td>${forma.nome}</td>
            <td>
                <span onclick="window.app.formasPagamento.editar('${forma.id}')" title="Editar">${ICONS.edit}</span>
                <span onclick="window.app.formasPagamento.deletar('${forma.id}', '${forma.nome}')" title="Excluir">${ICONS.delete}</span>
            </td>
        </tr>
    `).join('');
};

const popularSelects = () => {
    DOM.selectTurmaAluno.innerHTML = '<option selected disabled value="">Selecione...</option>';
    state.aulas.forEach(aula => {
        const alunosMatriculados = state.alunos.filter(a => a.turma === aula.nome).length;
        const vagasInfo = aula.vagas ? `(${alunosMatriculados}/${aula.vagas})` : '';
        const option = new Option(`${aula.nome} ${vagasInfo} (${aula.horario})`, aula.nome);
        // Desabilita opção se a turma estiver lotada E não for edição (pois o aluno já ocupa uma vaga)
        if(aula.vagas && alunosMatriculados >= aula.vagas && !DOM.formAluno['aluno-id'].value) {
            option.disabled = true;
        }
        DOM.selectTurmaAluno.add(option);
    });
    DOM.selectPlanoAluno.innerHTML = '<option selected disabled value="">Selecione...</option>';
    state.planos.forEach(plano => {
        const valorParcelaComDesconto = (plano.valorParcela || 0) * (1 - (plano.desconto || 0) / 100);
        const option = new Option(`${plano.nome} (${formatCurrency(valorParcelaComDesconto)}/mês)`, plano.nome);
        DOM.selectPlanoAluno.add(option);
    });
    DOM.selectFormaPagamentoModal.innerHTML = '';
    state.formasPagamento.forEach(forma => {
        const option = new Option(forma.nome, forma.nome);
        DOM.selectFormaPagamentoModal.add(option);
    });
};

const renderPrevisao = () => {
    const receitaBaseMensal = state.alunos.reduce((acc, aluno) => {
        const plano = state.planos.find(p => p.nome === aluno.plano);
        if (!plano) return acc;
        
        const valorParcelaPlano = (plano.valorParcela || 0) * (1 - (plano.desconto || 0) / 100);
        const valorFinalComBolsa = valorParcelaPlano * (1 - (aluno.bolsaPercentual || 0) / 100);
        
        return acc + valorFinalComBolsa;
    }, 0);

    let html = '';
    const hoje = new Date();
    for (let i = 1; i <= 6; i++) {
        const dataFutura = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
        const nomeMes = dataFutura.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric'});
        html += `<tr><td>${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}</td><td>${formatCurrency(receitaBaseMensal)}</td></tr>`;
    }
    DOM.tabelaPrevisao.innerHTML = html;
};

const popularFiltrosRelatorio = () => {
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    DOM.relatorioMes.innerHTML = meses.map((mes, index) => `<option value="${index}" ${index === mesAtual ? 'selected' : ''}>${mes}</option>`).join('');
    
    DOM.relatorioAno.innerHTML = '';
    for (let i = anoAtual; i >= anoAtual - 5; i--) {
        DOM.relatorioAno.add(new Option(i, i));
    }
};


// --- LÓGICA DE NEGÓCIO (Agrupada por módulo) --------------------------------

const appLogic = {

    // --- Alunos ---
    alunos: {
        handleForm: async (e) => {
            e.preventDefault();
            const id = e.target['aluno-id'].value;
            const matriculaIsenta = DOM.alunoMatriculaIsento.checked;
            const matriculaValor = matriculaIsenta ? 0 : parseFloat(DOM.alunoMatriculaValor.value || 0);

            const alunoData = {
                nome: e.target['aluno-nome'].value,
                telefone: e.target['aluno-telefone'].value,
                diaVencimento: parseInt(e.target['aluno-dia-vencimento'].value),
                turma: e.target['aluno-turma'].value,
                plano: e.target['aluno-plano'].value,
                bolsaPercentual: parseInt(DOM.selectBolsaAluno.value),
                matriculaIsenta: matriculaIsenta,
                matriculaValor: matriculaValor,
                dataCadastro: serverTimestamp() // Importante para a lógica de recorrência
            };
            
             // Validação de vagas
            if (!id) { // Só valida ao criar novo
                const aulaSelecionada = state.aulas.find(a => a.nome === alunoData.turma);
                if (aulaSelecionada && aulaSelecionada.vagas) {
                     const alunosNaTurma = state.alunos.filter(a => a.turma === alunoData.turma).length;
                     if (alunosNaTurma >= aulaSelecionada.vagas) {
                         showToast(`A turma "${alunoData.turma}" está lotada! Matricule com atenção.`, "Aviso", "warning");
                         // Não impede, apenas avisa
                     }
                }
            }

            try {
                if (id) {
                    delete alunoData.dataCadastro; 
                    await updateDoc(doc(db, 'alunos', id), alunoData);
                    showToast('Aluno atualizado com sucesso!');
                } else {
                    const docRef = await addDoc(collection(db, 'alunos'), alunoData);
                    showToast('Aluno salvo com sucesso! Gerando cobranças iniciais...');
                    alunoData.id = docRef.id;
                    alunoData.dataCadastro = { seconds: Date.now() / 1000 }; 
                    await appLogic.financeiro.gerarCobrancasIniciais(alunoData);
                }
                resetForm(DOM.formAluno, DOM.btnCancelarEdicaoAluno, DOM.alunosCardTitle, 'Cadastro de Alunos');
            } catch (error) {
                console.error("Erro ao salvar aluno: ", error);
                showToast('Erro ao salvar aluno.', 'Erro', 'error');
            }
        },

        editar: (id) => {
            const aluno = state.alunos.find(a => a.id === id);
            if (!aluno) return;
            DOM.formAluno['aluno-id'].value = id;
            DOM.formAluno['aluno-nome'].value = aluno.nome;
            DOM.formAluno['aluno-telefone'].value = aluno.telefone;
            DOM.formAluno['aluno-dia-vencimento'].value = aluno.diaVencimento;
            DOM.formAluno['aluno-turma'].value = aluno.turma;
            DOM.formAluno['aluno-plano'].value = aluno.plano;
            DOM.selectBolsaAluno.value = aluno.bolsaPercentual || "0";
            DOM.alunoMatriculaIsento.checked = aluno.matriculaIsenta || false;
            DOM.alunoMatriculaValor.value = aluno.matriculaValor || '';
            DOM.alunoMatriculaValor.disabled = DOM.alunoMatriculaIsento.checked;
            DOM.btnCancelarEdicaoAluno.style.display = 'inline-block';
            DOM.alunosCardTitle.textContent = 'Editando Aluno';
            DOM.formAluno.querySelector('button[type="submit"]').textContent = 'Atualizar Aluno';
            new bootstrap.Tab(document.getElementById('alunos-tab')).show();
            DOM.formAluno['aluno-nome'].focus();
        },

        deletar: (id, nome) => {
            appLogic.utils.deletarGeneric(id, nome, 'alunos', 'Aluno');
        },
    },

    // --- Aulas ---
    aulas: {
        handleForm: async (e) => {
            e.preventDefault();
            const id = e.target['aula-id'].value;
            const dias = {};
            DOM.aulaDiasSemana.querySelectorAll('input[type="checkbox"]').forEach(c => { dias[c.value] = c.checked; });
            const aulaData = {
                nome: e.target['aula-nome'].value,
                horario: e.target['aula-horario'].value,
                vagas: parseInt(DOM.aulaVagas.value) || null, // null se vazio
                dias: dias
            };

            try {
                if(id) {
                    await updateDoc(doc(db, 'aulas', id), aulaData);
                    showToast('Aula atualizada com sucesso!');
                } else {
                    await addDoc(collection(db, 'aulas'), aulaData);
                    showToast('Aula salva com sucesso!');
                }
                resetForm(DOM.formAula, DOM.btnCancelarEdicaoAula);
            } catch (error) {
                console.error("Erro ao salvar aula: ", error);
                showToast('Erro ao salvar aula.', 'Erro', 'error');
            }
        },

        editar: (id) => {
            const aula = state.aulas.find(a => a.id === id);
            if (!aula) return;
            DOM.formAula['aula-id'].value = id;
            DOM.formAula['aula-nome'].value = aula.nome;
            DOM.formAula['aula-horario'].value = aula.horario;
            DOM.aulaVagas.value = aula.vagas || '';
            DOM.aulaDiasSemana.querySelectorAll('input[type="checkbox"]').forEach(c => {
                c.checked = aula.dias ? (aula.dias[c.value] || false) : false;
            });
            DOM.btnCancelarEdicaoAula.style.display = 'inline-block';
            DOM.formAula.querySelector('button[type="submit"]').textContent = 'Atualizar Aula';
            new bootstrap.Tab(document.getElementById('aulas-tab')).show();
        },

        deletar: (id, nome) => {
            appLogic.utils.deletarGeneric(id, nome, 'aulas', 'Aula');
        },

        marcarPresenca: async (checkbox) => {
            const alunoId = checkbox.dataset.alunoId;
            const aulaId = checkbox.dataset.aulaId;
            const data = checkbox.dataset.data;
            const presente = checkbox.checked;
            const label = checkbox.nextElementSibling;

            const presencaKey = `${data}_${aulaId}`;
            
            // Atualiza estado local primeiro para feedback rápido
            if (!state.presencas[presencaKey]) {
                state.presencas[presencaKey] = {};
            }
            state.presencas[presencaKey][alunoId] = presente;
            
            // Atualiza UI
            label.textContent = presente ? 'Presente' : 'Ausente';
            const alunoSpan = checkbox.closest('li').querySelector('span:first-child');
            alunoSpan.classList.toggle('aluno-presente', presente);

            try {
                // Salva no Firestore
                const presencaDocRef = doc(db, 'presencas', presencaKey);
                const updateData = {};
                updateData[alunoId] = presente; // Campo com ID do aluno
                
                // Usar set com merge para criar ou atualizar o campo do aluno sem sobrescrever outros
                await setDoc(presencaDocRef, updateData, { merge: true });
                
            } catch (error) {
                console.error("Erro ao salvar presença:", error);
                showToast("Erro ao salvar presença.", "Erro", "error");
                // Reverte a UI em caso de erro
                checkbox.checked = !presente;
                label.textContent = !presente ? 'Presente' : 'Ausente';
                alunoSpan.classList.toggle('aluno-presente', !presente);
                // Reverte estado local
                state.presencas[presencaKey][alunoId] = !presente; 
            }
        }
    },
    
    // --- Planos ---
    planos: {
         calcularValorTotalPlanoForm: () => {
            const valorParcela = parseFloat(DOM.planoValorParcela.value) || 0;
            const meses = parseInt(DOM.planoMeses.value) || 1;
            const desconto = parseFloat(DOM.planoDesconto.value) || 0;
            const valorTotal = valorParcela * meses;
            const valorTotalComDesconto = valorTotal * (1 - desconto / 100);
            DOM.planoValorTotalCalculado.value = formatCurrency(valorTotalComDesconto);
        },
        
        handleForm: async (e) => {
            e.preventDefault();
            const form = e.target;
            const id = form['plano-id'].value;
            const planoData = {
                nome: form['plano-nome'].value,
                valorParcela: parseFloat(DOM.planoValorParcela.value),
                numeroMeses: parseInt(DOM.planoMeses.value),
                desconto: parseFloat(DOM.planoDesconto.value) || 0
            };
            try {
                if(id) {
                    await updateDoc(doc(db, 'planos', id), planoData);
                    showToast('Plano atualizado com sucesso!');
                } else {
                    await addDoc(collection(db, 'planos'), planoData);
                    showToast('Plano salvo com sucesso!');
                }
                resetForm(form, form.querySelector('button[type="button"]'));
            } catch (error) {
                console.error('Erro ao salvar plano:', error);
                showToast('Erro ao salvar plano.', 'Erro', 'error');
            }
        },

        editar: (id) => {
            const item = state.planos.find(i => i.id === id);
            if(!item) return;
            const form = DOM.formPlano;
            form['plano-id'].value = item.id;
            form['plano-nome'].value = item.nome;
            DOM.planoValorParcela.value = item.valorParcela;
            DOM.planoMeses.value = item.numeroMeses;
            DOM.planoDesconto.value = item.desconto;
            form.querySelector('button[type="button"]').style.display = 'inline-block';
            form.querySelector('button[type="submit"]').textContent = 'Atualizar';
            appLogic.planos.calcularValorTotalPlanoForm();
            new bootstrap.Tab(document.getElementById('config-tab')).show();
        },
        
         deletar: (id, nome) => {
            appLogic.utils.deletarGeneric(id, nome, 'planos', 'Plano');
        },
    },
    
    // --- Formas de Pagamento ---
    formasPagamento: {
        handleForm: async (e) => {
            e.preventDefault();
            const form = e.target;
            const id = form['forma-pagamento-id'].value;
            const nome = form['forma-pagamento-nome'].value;
            try {
                if(id) {
                    await updateDoc(doc(db, 'formasDePagamento', id), { nome });
                    showToast('Forma de Pagamento atualizada com sucesso!');
                } else {
                    await addDoc(collection(db, 'formasDePagamento'), { nome });
                    showToast('Forma de Pagamento salva com sucesso!');
                }
                resetForm(form, form.querySelector('button[type="button"]'));
            } catch (error) {
                console.error('Erro ao salvar forma de pagamento:', error);
                showToast('Erro ao salvar forma de pagamento.', 'Erro', 'error');
            }
        },

        editar: (id) => {
            const item = state.formasPagamento.find(i => i.id === id);
            if(!item) return;
            const form = DOM.formFormasPagamento;
            form['forma-pagamento-id'].value = item.id;
            form['forma-pagamento-nome'].value = item.nome;
            form.querySelector('button[type="button"]').style.display = 'inline-block';
            form.querySelector('button[type="submit"]').textContent = 'Atualizar';
            new bootstrap.Tab(document.getElementById('config-tab')).show();
        },
        
        deletar: (id, nome) => {
            appLogic.utils.deletarGeneric(id, nome, 'formasDePagamento', 'Forma de Pagamento');
        },
    },

    // --- Financeiro (Mensalidades, Pagamentos, Relatórios) ---
    financeiro: {
        abrirModalPagamento: (mensalidadeId) => {
            const mensalidade = state.mensalidades.find(m => m.id === mensalidadeId);
            DOM.formPagamentoLancamento.reset();
            document.getElementById('pagamento-mensalidade-id').value = mensalidadeId;
            document.getElementById('pagamento-aluno-nome').textContent = mensalidade.alunoNome;
            DOM.pagamentoValor.value = mensalidade.valorPlano.toFixed(2);
            document.getElementById('pagamento-data').valueAsDate = new Date();
            appLogic.financeiro.calcularValorFinalPagamento(); // Calcula o valor inicial
            DOM.modalPagamento.show();
        },
        
        calcularValorFinalPagamento: () => {
            const valor = parseFloat(DOM.pagamentoValor.value) || 0;
            const desconto = parseFloat(DOM.pagamentoDesconto.value) || 0;
            DOM.pagamentoValorFinal.value = (valor - desconto).toFixed(2);
        },

        handlePagamentoForm: async (e) => {
            e.preventDefault();
            const mensalidadeId = document.getElementById('pagamento-mensalidade-id').value;
            const valorPago = parseFloat(DOM.pagamentoValor.value);
            const desconto = parseFloat(DOM.pagamentoDesconto.value) || 0;

            const updateData = {
                status: 'Pago',
                valorPago: valorPago,
                desconto: desconto,
                valorFinal: valorPago - desconto,
                dataPagamento: Timestamp.fromDate(new Date(document.getElementById('pagamento-data').value + 'T12:00:00')), // Add time to avoid timezone issues
                formaPagamento: document.getElementById('pagamento-forma').value
            };
            try {
                await updateDoc(doc(db, 'mensalidades', mensalidadeId), updateData);
                showToast('Pagamento salvo com sucesso!');
                DOM.modalPagamento.hide();
            } catch (error) {
                console.error("Erro ao salvar pagamento: ", error);
                showToast('Erro ao salvar pagamento.', 'Erro', 'error');
            }
        },

        gerarCobrancasIniciais: async (aluno) => {
            try {
                const batch = writeBatch(db);
                const mensalidadesCollection = collection(db, "mensalidades");
                const hoje = new Date();

                if (!aluno.matriculaIsenta && aluno.matriculaValor > 0) {
                    const matriculaRef = doc(mensalidadesCollection);
                    batch.set(matriculaRef, {
                        alunoId: aluno.id, alunoNome: `Matrícula - ${aluno.nome}`, dataVencimento: Timestamp.fromDate(hoje), status: 'Pendente', valorPlano: aluno.matriculaValor, tipo: 'matricula', mesAnoReferencia: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
                    });
                }
                const planoAluno = state.planos.find(p => p.nome === aluno.plano);
                if (!planoAluno) throw new Error(`Plano "${aluno.plano}" não encontrado.`);
                
                const valorParcelaPlano = (planoAluno.valorParcela || 0) * (1 - (planoAluno.desconto || 0) / 100);
                const valorFinalComBolsa = valorParcelaPlano * (1 - (aluno.bolsaPercentual || 0) / 100);
                const dataVencimentoMensalidade = new Date(hoje.getFullYear(), hoje.getMonth(), aluno.diaVencimento);
                
                const mensalidadeRef = doc(mensalidadesCollection);
                batch.set(mensalidadeRef, {
                    alunoId: aluno.id, alunoNome: aluno.nome, dataVencimento: Timestamp.fromDate(dataVencimentoMensalidade), status: 'Pendente', valorPlano: valorFinalComBolsa, tipo: 'mensalidade', mesAnoReferencia: `${dataVencimentoMensalidade.getFullYear()}-${String(dataVencimentoMensalidade.getMonth() + 1).padStart(2, '0')}`
                });
                await batch.commit();
             } catch (error) {
                 console.error("Erro ao gerar cobranças iniciais:", error);
                 showToast(`Erro: ${error.message}`, 'Erro', 'error');
             }
        },

        gerarMensalidadesRecorrentes: () => {
             showConfirmation('Gerar Mensalidades', 'Isso irá verificar todos os alunos e gerar quaisquer mensalidades pendentes até o mês atual. Deseja continuar?', async () => {
                DOM.initialLoading.style.display = 'flex';
                let mensalidadesGeradas = 0;
                
                try {
                    const batch = writeBatch(db);
                    const mensalidadesCollection = collection(db, "mensalidades");
                    
                    for (const aluno of state.alunos) {
                        if (!aluno.dataCadastro || !aluno.plano) continue; 
                        const planoAluno = state.planos.find(p => p.nome === aluno.plano);
                        if (!planoAluno) continue;

                        const mensalidadesAluno = state.mensalidades.filter(m => m.alunoId === aluno.id && m.tipo === 'mensalidade').sort((a,b) => b.dataVencimento.seconds - a.dataVencimento.seconds);
                        
                        let dataUltimaMensalidade;
                         if (mensalidadesAluno.length > 0) {
                            dataUltimaMensalidade = new Date(mensalidadesAluno[0].dataVencimento.seconds * 1000);
                         } else if (aluno.dataCadastro.seconds) {
                            dataUltimaMensalidade = new Date(aluno.dataCadastro.seconds * 1000);
                            // Se a data de cadastro for depois do dia do vencimento no mês, a primeira mensalidade já foi criada, então começamos do mês seguinte
                            if(dataUltimaMensalidade.getDate() > aluno.diaVencimento) {
                                 dataUltimaMensalidade.setMonth(dataUltimaMensalidade.getMonth() + 1);
                            }
                         } else {
                            continue; // Pula se não tiver nem mensalidade anterior nem data de cadastro válida
                         }

                        let proximaData = new Date(dataUltimaMensalidade.getFullYear(), dataUltimaMensalidade.getMonth() + 1, aluno.diaVencimento);
                        const hoje = new Date();

                        while(proximaData <= hoje) {
                             const valorParcelaPlano = (planoAluno.valorParcela || 0) * (1 - (planoAluno.desconto || 0) / 100);
                             const valorFinalComBolsa = valorParcelaPlano * (1 - (aluno.bolsaPercentual || 0) / 100);
                             
                             const newMensalidadeRef = doc(mensalidadesCollection);
                             batch.set(newMensalidadeRef, {
                                 alunoId: aluno.id, alunoNome: aluno.nome, dataVencimento: Timestamp.fromDate(proximaData), status: 'Pendente', valorPlano: valorFinalComBolsa, tipo: 'mensalidade', mesAnoReferencia: `${proximaData.getFullYear()}-${String(proximaData.getMonth() + 1).padStart(2, '0')}`
                             });
                             mensalidadesGeradas++;
                             proximaData.setMonth(proximaData.getMonth() + 1);
                        }
                    }

                    if (mensalidadesGeradas > 0) {
                        await batch.commit();
                        showToast(`${mensalidadesGeradas} nova(s) mensalidade(s) gerada(s) com sucesso!`);
                    } else {
                        showToast('Nenhuma nova mensalidade precisou ser gerada. Tudo em dia!', 'Aviso', 'success');
                    }

                } catch(error) {
                    console.error("Erro ao gerar mensalidades:", error);
                    showToast('Ocorreu um erro ao gerar as mensalidades.', 'Erro', 'error');
                } finally {
                    DOM.initialLoading.style.display = 'none';
                }
            });
        },


        gerarRecibo: (mensalidadeId) => {
            const mensalidade = state.mensalidades.find(m => m.id === mensalidadeId);
            if (!mensalidade) return;

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a5' }); // A5: 148 x 210 mm
            const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            const primaryColor = '#4A90E2';
            const textColor = '#343A40';
            const grayColor = '#868e96';
            const pageWidth = 148;
            const margin = 10;

            doc.setDrawColor(primaryColor); doc.setLineWidth(1); doc.rect(5, 5, pageWidth - 10, 200);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(primaryColor); doc.text('Studio Carla Borges', pageWidth / 2, 20, { align: 'center' });
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(grayColor); doc.text('RECIBO DE PAGAMENTO', pageWidth / 2, 28, { align: 'center' });
            doc.setLineWidth(0.5); doc.setDrawColor(primaryColor); doc.line(margin + 10, 32, pageWidth - margin - 10, 32);
            doc.setTextColor(textColor); doc.setFontSize(11);
            let y = 45;
            doc.setFont('helvetica', 'bold'); doc.text('Recebemos de:', margin, y); doc.setFont('helvetica', 'normal'); doc.text(mensalidade.alunoNome.replace('Matrícula - ', ''), margin + 35, y); y += 10;
            doc.setFont('helvetica', 'bold'); doc.text('A importância de:', margin, y); doc.setFont('helvetica', 'normal'); doc.text(formatCurrency(mensalidade.valorFinal), margin + 35, y); y += 15;
            doc.setFont('helvetica', 'bold'); doc.text('DETALHES DA COBRANÇA', margin, y); y += 4; doc.setLineWidth(0.2); doc.setDrawColor(grayColor); doc.line(margin, y, pageWidth - margin, y); y += 7;
            const addDetailRow = (label, value) => { doc.setFont('helvetica', 'bold'); doc.text(label, margin + 5, y); doc.setFont('helvetica', 'normal'); doc.text(value, margin + 45, y); y += 7; };
            const descricao = mensalidade.tipo === 'matricula' ? 'Matrícula' : `Mensalidade ${mensalidade.mesAnoReferencia.split('-').reverse().join('/')}`;
            addDetailRow('Descrição:', descricao); addDetailRow('Valor Original:', formatCurrency(mensalidade.valorPlano)); if (mensalidade.desconto > 0) { addDetailRow('Desconto Aplicado:', formatCurrency(mensalidade.desconto)); }
            addDetailRow('Valor Final Pago:', formatCurrency(mensalidade.valorFinal)); addDetailRow('Data do Pagamento:', formatDate(mensalidade.dataPagamento)); addDetailRow('Forma de Pagamento:', mensalidade.formaPagamento);
            y += 20; doc.setFontSize(10); doc.setTextColor(grayColor); doc.text(`Contagem, ${hoje}.`, pageWidth / 2, y, { align: 'center' }); y += 25;
            doc.setFont('Times', 'italic'); doc.setFontSize(16); doc.setTextColor(textColor); doc.text('Carla Borges', pageWidth / 2, y, { align: 'center' }); y += 3;
            doc.setLineWidth(0.3); doc.setDrawColor(textColor); doc.line(pageWidth / 2 - 25, y, pageWidth / 2 + 25, y); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text('Studio Carla Borges', pageWidth / 2, y + 4, { align: 'center' });
            doc.save(`Recibo_${mensalidade.alunoNome.replace(/ /g, '_')}.pdf`);
        },
        
        gerarBalancete: () => {
             const mes = parseInt(DOM.relatorioMes.value);
             const ano = parseInt(DOM.relatorioAno.value);
             const nomeMes = DOM.relatorioMes.options[DOM.relatorioMes.selectedIndex].text;
             const inicioPeriodo = new Date(ano, mes, 1);
             const fimPeriodo = new Date(ano, mes + 1, 0, 23, 59, 59);
             const entradas = []; const saidas = [];
             
             state.mensalidades.forEach(m => {
                 if(m.status === 'Pago' && m.dataPagamento) {
                     const dataPgto = new Date(m.dataPagamento.seconds * 1000);
                     if (dataPgto >= inicioPeriodo && dataPgto <= fimPeriodo) { entradas.push({ data: dataPgto, descricao: `Pgto: ${m.alunoNome}`, categoria: (m.tipo === 'matricula' ? 'Matrícula' : 'Mensalidade'), valor: m.valorFinal }); }
                 }
             });
             state.caixa.forEach(c => {
                 const dataLanc = new Date(c.data.seconds * 1000);
                 if (dataLanc >= inicioPeriodo && dataLanc <= fimPeriodo) {
                     if (c.tipo === 'entrada') { entradas.push({ data: dataLanc, descricao: c.descricao, categoria: c.categoria || 'Outros', valor: c.valor }); } 
                     else { saidas.push({ data: dataLanc, descricao: c.descricao, categoria: c.categoria || 'Outros', valor: c.valor }); }
                 }
             });
             const totalEntradas = entradas.reduce((acc, item) => acc + item.valor, 0);
             const totalSaidas = saidas.reduce((acc, item) => acc + item.valor, 0);
             const saldo = totalEntradas - totalSaidas;
             
             const { jsPDF } = window.jspdf; const doc = new jsPDF();
             doc.setFontSize(18); doc.text(`Balancete Financeiro - ${nomeMes} de ${ano}`, 14, 22);
             const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 200; const ctx = canvas.getContext('2d');
             const reportChart = new Chart(ctx, { type: 'doughnut', data: { labels: [`Entradas (${formatCurrency(totalEntradas)})`, `Saídas (${formatCurrency(totalSaidas)})`], datasets: [{ data: [totalEntradas, totalSaidas], backgroundColor: [ 'rgba(25, 135, 84, 0.7)', 'rgba(220, 53, 69, 0.7)' ], borderColor: [ 'rgba(25, 135, 84, 1)', 'rgba(220, 53, 69, 1)' ], borderWidth: 1 }] }, options: { responsive: false, animation: { duration: 0 }, plugins: { legend: { position: 'right' } } } });

            setTimeout(() => {
                const chartImage = canvas.toDataURL('image/png'); reportChart.destroy();
                let y = 40; doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text('Resumo do Período', 14, y); y += 7; doc.setFont('helvetica', 'normal');
                doc.text(`Total de Entradas: ${formatCurrency(totalEntradas)}`, 14, y); y += 6; doc.text(`Total de Saídas: ${formatCurrency(totalSaidas)}`, 14, y); y += 2; doc.setLineWidth(0.2); doc.line(14, y, 90, y); y += 6;
                doc.setFont('helvetica', 'bold'); doc.setTextColor(saldo >= 0 ? 34 : 220, saldo >= 0 ? 34 : 53, saldo >= 0 ? 34 : 69); doc.text(`Saldo Final: ${formatCurrency(saldo)}`, 14, y); doc.setTextColor(0,0,0);
                if(totalEntradas > 0 || totalSaidas > 0) { doc.addImage(chartImage, 'PNG', 105, 40, 90, 45); }
                const startYTables = 100;
                if (entradas.length > 0) { doc.autoTable({ startY: startYTables, head: [['Data', 'Descrição', 'Categoria', 'Valor (R$)']], body: entradas.sort((a,b) => a.data - b.data).map(e => [e.data.toLocaleDateString('pt-BR'), e.descricao, e.categoria, e.valor.toFixed(2).replace('.', ',')]), theme: 'striped', headStyles: { fillColor: [25, 135, 84] }, didDrawPage: (data) => { doc.setFontSize(14); doc.text('DETALHAMENTO DE ENTRADAS', 14, data.cursor.y - 10); } }); } else { doc.text('Nenhuma entrada registrada no período.', 14, startYTables); }
                const startYSaidas = entradas.length > 0 ? doc.autoTable.previous.finalY + 15 : startYTables + 15;
                if(saidas.length > 0) { doc.autoTable({ startY: startYSaidas, head: [['Data', 'Descrição', 'Categoria', 'Valor (R$)']], body: saidas.sort((a,b) => a.data - b.data).map(s => [s.data.toLocaleDateString('pt-BR'), s.descricao, s.categoria, s.valor.toFixed(2).replace('.', ',')]), theme: 'striped', headStyles: { fillColor: [220, 53, 69] }, didDrawPage: (data) => { doc.setFontSize(14); doc.text('DETALHAMENTO DE SAÍDAS', 14, data.cursor.y - 10); } }); } else { doc.text('Nenhuma saída registrada no período.', 14, startYSaidas); }
                doc.save(`Balancete_${nomeMes}_${ano}.pdf`);
            }, 500);
        },
        
        gerarRelatorioInadimplencia: () => {
            const hoje = new Date(); hoje.setHours(0,0,0,0);
            const inadimplentes = state.mensalidades.filter(m => m.status !== 'Pago' && new Date(m.dataVencimento.seconds * 1000) < hoje);
            
            if (inadimplentes.length === 0) {
                showToast("Nenhum aluno inadimplente encontrado!", "Informação", "info");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const dataGeracao = new Date().toLocaleDateString('pt-BR');

            doc.setFontSize(18); doc.text(`Relatório de Inadimplência`, 14, 22);
            doc.setFontSize(11); doc.text(`Gerado em: ${dataGeracao}`, 14, 28);

            const head = [['Aluno', 'Descrição', 'Vencimento', 'Dias Atraso', 'Valor Devido (R$)']];
            const body = inadimplentes
                .sort((a, b) => a.dataVencimento.seconds - b.dataVencimento.seconds) // Ordena por vencimento
                .map(m => {
                    const vencimento = new Date(m.dataVencimento.seconds * 1000);
                    const diasAtraso = Math.floor((hoje - vencimento) / (1000 * 60 * 60 * 24));
                    const descricao = m.tipo === 'matricula' ? 'Matrícula' : `Mensalidade ${m.mesAnoReferencia.split('-').reverse().join('/')}`;
                    return [
                        m.alunoNome.replace('Matrícula - ', ''),
                        descricao,
                        vencimento.toLocaleDateString('pt-BR'),
                        diasAtraso,
                        m.valorPlano.toFixed(2).replace('.', ',')
                    ];
                });

            doc.autoTable({
                startY: 40,
                head: head,
                body: body,
                theme: 'striped',
                headStyles: { fillColor: [220, 53, 69] } // Vermelho
            });

            const totalDevido = inadimplentes.reduce((acc, m) => acc + m.valorPlano, 0);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Devido: ${formatCurrency(totalDevido)}`, 14, doc.autoTable.previous.finalY + 10);

            doc.save(`Relatorio_Inadimplencia_${dataGeracao}.pdf`);
        },
    },
    
     // --- Caixa ---
    caixa: {
        handleForm: async (e) => {
            e.preventDefault();
            const form = e.target;
            const id = form['caixa-id'].value;
            const caixaData = {
                descricao: form['caixa-descricao'].value,
                valor: parseFloat(form['caixa-valor'].value),
                data: Timestamp.fromDate(new Date(form['caixa-data'].value + 'T12:00:00')), // Add time to avoid timezone issues
                categoria: form['caixa-categoria'].value || 'Outros',
                tipo: form['caixa-tipo'].value,
            };

            try {
                if (id) {
                    await updateDoc(doc(db, 'caixa', id), caixaData);
                    showToast('Lançamento atualizado com sucesso!');
                } else {
                    await addDoc(collection(db, 'caixa'), caixaData);
                    showToast('Lançamento salvo com sucesso!');
                }
                resetForm(DOM.formCaixa, DOM.btnCancelarEdicaoCaixa);
            } catch (error) {
                console.error("Erro ao salvar lançamento no caixa:", error);
                showToast("Erro ao salvar lançamento.", "Erro", "error");
            }
        },
        
        editar: (id) => {
            const item = state.caixa.find(c => c.id === id);
            if (!item) return;

            const form = DOM.formCaixa;
            form['caixa-id'].value = id;
            form['caixa-descricao'].value = item.descricao;
            form['caixa-valor'].value = item.valor;
            form['caixa-data'].valueAsDate = new Date(item.data.seconds * 1000);
            form['caixa-categoria'].value = item.categoria || '';
            form['caixa-tipo'].value = item.tipo;
            
            DOM.btnCancelarEdicaoCaixa.style.display = 'block';
            form.querySelector('button[type="submit"]').textContent = 'Atualizar';
            new bootstrap.Tab(document.getElementById('caixa-tab')).show();
            form['caixa-descricao'].focus();
        },

        deletar: (id, descricao) => {
            appLogic.utils.deletarGeneric(id, descricao, 'caixa', 'Lançamento de Caixa');
        },
    },
    
    // --- Utilitários ---
    utils: {
         deletarGeneric: (id, nome, collectionName, singularName) => {
            showConfirmation(`Deletar ${singularName}`, `Tem certeza que deseja deletar ${nome}?`, async () => {
                try {
                    await deleteDoc(doc(db, collectionName, id));
                    showToast(`${singularName} deletado com sucesso!`);
                } catch (error) {
                    console.error(`Erro ao deletar ${singularName}:`, error);
                    showToast(`Erro ao deletar ${singularName}.`, 'Erro', 'error');
                }
            });
        },
    },

    // --- Autenticação ---
    auth: {
        handleLogin: async (e) => {
            e.preventDefault();
            const email = DOM.loginForm['login-email'].value;
            const password = DOM.loginForm['login-password'].value;
            DOM.loginError.style.display = 'none';
            DOM.initialLoading.style.display = 'flex'; // Mostra loading durante o login

            try {
                await signInWithEmailAndPassword(auth, email, password);
                // Sucesso: onAuthStateChanged vai cuidar de mostrar o app
            } catch (error) {
                console.error("Erro de login:", error.code, error.message);
                let friendlyMessage = "Erro ao fazer login. Verifique seu e-mail e senha.";
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    friendlyMessage = "E-mail ou senha inválidos.";
                } else if (error.code === 'auth/invalid-email') {
                     friendlyMessage = "Formato de e-mail inválido.";
                }
                DOM.loginError.textContent = friendlyMessage;
                DOM.loginError.style.display = 'block';
            } finally {
                 DOM.initialLoading.style.display = 'none'; // Esconde loading
            }
        },

        handleLogout: async () => {
             DOM.initialLoading.style.display = 'flex'; // Mostra loading durante o logout
            try {
                await signOut(auth);
                // Sucesso: onAuthStateChanged vai cuidar de mostrar o login
            } catch (error) {
                console.error("Erro ao fazer logout:", error);
                showToast("Erro ao sair.", "Erro", "error");
            } finally {
                 DOM.initialLoading.style.display = 'none'; // Esconde loading
            }
        },
        
        // Função para iniciar os listeners do Firestore
        initializeFirestoreListeners: () => {
             // Limpa listeners antigos antes de criar novos
            appLogic.auth.detachFirestoreListeners(); 
            
            console.log("Inicializando listeners do Firestore...");

            const commonErrorHandler = (collectionName) => (error) => {
                console.error(`Erro no listener de ${collectionName}:`, error);
                // Poderia adicionar um toast aqui se quisesse notificar o usuário
            };

            // Adiciona cada unsubscribe à lista
            state.firestoreListeners.push(onSnapshot(query(collection(db, 'alunos'), orderBy('nome')), (snapshot) => { state.alunos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderTabelaAlunos(); renderPainelDoDia(); renderPrevisao(); popularSelects(); }, commonErrorHandler('Alunos')));
            state.firestoreListeners.push(onSnapshot(query(collection(db, 'aulas'), orderBy('horario')), (snapshot) => { state.aulas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderTabelaAulas(); renderPainelDoDia(); popularSelects(); }, commonErrorHandler('Aulas')));
            state.firestoreListeners.push(onSnapshot(query(collection(db, 'planos'), orderBy('nome')), (snapshot) => { state.planos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderTabelaPlanos(); popularSelects(); renderPrevisao(); }, commonErrorHandler('Planos')));
            state.firestoreListeners.push(onSnapshot(query(collection(db, 'formasDePagamento'), orderBy('nome')), (snapshot) => { state.formasPagamento = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderTabelaFormasPagamento(); popularSelects(); }, commonErrorHandler('Formas de Pagamento')));
            state.firestoreListeners.push(onSnapshot(query(collection(db, 'mensalidades'), orderBy('dataVencimento', 'desc')), (snapshot) => { state.mensalidades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderTabelaFinanceiraAlunos(); calcularERenderizarResumoFinanceiro(); }, commonErrorHandler('Mensalidades')));
            state.firestoreListeners.push(onSnapshot(query(collection(db, 'caixa'), orderBy('data', 'desc')), (snapshot) => { state.caixa = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderTabelaCaixa(); calcularERenderizarResumoFinanceiro(); }, commonErrorHandler('Caixa')));
            state.firestoreListeners.push(onSnapshot(collection(db, 'presencas'), (snapshot) => { state.presencas = {}; snapshot.docs.forEach(doc => { state.presencas[doc.id] = doc.data(); }); renderPainelDoDia(); }, commonErrorHandler('Presenças')));
            
            // Esconde o loading inicial APÓS iniciar os listeners
            DOM.initialLoading.style.display = 'none';
        },

        // Função para remover os listeners do Firestore
        detachFirestoreListeners: () => {
            console.log("Removendo listeners do Firestore...");
            state.firestoreListeners.forEach(unsubscribe => unsubscribe());
            state.firestoreListeners = []; // Limpa a lista
        }
    }
};

// Tornar funções acessíveis globalmente (para `onclick` e `onchange` no HTML)
window.app = {
    alunos: { editar: appLogic.alunos.editar, deletar: appLogic.alunos.deletar },
    aulas: { editar: appLogic.aulas.editar, deletar: appLogic.aulas.deletar, marcarPresenca: appLogic.aulas.marcarPresenca },
    planos: { editar: appLogic.planos.editar, deletar: appLogic.planos.deletar },
    formasPagamento: { editar: appLogic.formasPagamento.editar, deletar: appLogic.formasPagamento.deletar },
    financeiro: { abrirModalPagamento: appLogic.financeiro.abrirModalPagamento, gerarRecibo: appLogic.financeiro.gerarRecibo },
    caixa: { editar: appLogic.caixa.editar, deletar: appLogic.caixa.deletar },
};

// --- INICIALIZAÇÃO E LISTENERS GLOBAIS -------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Mostra loading inicial
    DOM.initialLoading.style.display = 'flex'; 
    
    // Forms
    DOM.formAluno.addEventListener('submit', appLogic.alunos.handleForm);
    DOM.formAula.addEventListener('submit', appLogic.aulas.handleForm);
    DOM.formPlano.addEventListener('submit', appLogic.planos.handleForm);
    DOM.formFormasPagamento.addEventListener('submit', appLogic.formasPagamento.handleForm);
    DOM.formPagamentoLancamento.addEventListener('submit', appLogic.financeiro.handlePagamentoForm);
    DOM.formCaixa.addEventListener('submit', appLogic.caixa.handleForm);
    DOM.loginForm.addEventListener('submit', appLogic.auth.handleLogin); // Login

    // Inputs com cálculos dinâmicos
    DOM.pagamentoValor.addEventListener('input', appLogic.financeiro.calcularValorFinalPagamento);
    DOM.pagamentoDesconto.addEventListener('input', appLogic.financeiro.calcularValorFinalPagamento);
    DOM.planoValorParcela.addEventListener('input', appLogic.planos.calcularValorTotalPlanoForm);
    DOM.planoMeses.addEventListener('input', appLogic.planos.calcularValorTotalPlanoForm);
    DOM.planoDesconto.addEventListener('input', appLogic.planos.calcularValorTotalPlanoForm);

    // Botões Cancelar Edição
    DOM.btnCancelarEdicaoAluno.addEventListener('click', () => resetForm(DOM.formAluno, DOM.btnCancelarEdicaoAluno, DOM.alunosCardTitle, 'Cadastro de Alunos'));
    DOM.btnCancelarEdicaoAula.addEventListener('click', () => resetForm(DOM.formAula, DOM.btnCancelarEdicaoAula));
    DOM.btnCancelarEdicaoPlano.addEventListener('click', () => resetForm(DOM.formPlano, DOM.btnCancelarEdicaoPlano));
    DOM.btnCancelarEdicaoFormaPagamento.addEventListener('click', () => resetForm(DOM.formFormasPagamento, DOM.btnCancelarEdicaoFormaPagamento));
    DOM.btnCancelarEdicaoCaixa.addEventListener('click', () => resetForm(DOM.formCaixa, DOM.btnCancelarEdicaoCaixa));
    
    // Outros Listeners
    DOM.alunoMatriculaIsento.addEventListener('change', (e) => { DOM.alunoMatriculaValor.disabled = e.target.checked; if (e.target.checked) DOM.alunoMatriculaValor.value = ''; });
    DOM.filtrosFinanceiro.addEventListener('click', (e) => { if (e.target.matches('button[data-filtro]')) { DOM.filtrosFinanceiro.querySelector('.active').classList.remove('active'); e.target.classList.add('active'); state.filtroFinanceiro = e.target.dataset.filtro; renderTabelaFinanceiraAlunos(); } });
    DOM.btnGerarMensalidades.addEventListener('click', appLogic.financeiro.gerarMensalidadesRecorrentes);
    DOM.btnGerarBalancete.addEventListener('click', appLogic.financeiro.gerarBalancete);
    DOM.btnGerarRelatorioInadimplencia.addEventListener('click', appLogic.financeiro.gerarRelatorioInadimplencia);
    DOM.logoutButton.addEventListener('click', appLogic.auth.handleLogout); // Logout
    
    applyPhoneMask(DOM.formAluno['aluno-telefone']); // Aplica máscara ao telefone
    popularFiltrosRelatorio();
    resetForm(DOM.formCaixa);
    
    // --- Listener Central de Autenticação ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuário está logado
            console.log("Usuário logado:", user.email);
            DOM.loginSection.style.display = 'none';
            DOM.mainAppSection.style.display = 'block';
            DOM.userInfo.style.display = 'block';
            DOM.userEmail.textContent = user.email;
            
            // Inicia os listeners do Firestore APÓS o login
            appLogic.auth.initializeFirestoreListeners(); 

        } else {
            // Usuário está deslogado
            console.log("Usuário deslogado.");
            DOM.loginSection.style.display = 'block';
            DOM.mainAppSection.style.display = 'none';
            DOM.userInfo.style.display = 'none';
            DOM.userEmail.textContent = '';
            DOM.initialLoading.style.display = 'none'; // Esconde loading se estava visível

            // Remove os listeners do Firestore ao deslogar
            appLogic.auth.detachFirestoreListeners();
            
            // Limpa o estado local para não mostrar dados antigos se outro usuário logar
             Object.keys(state).forEach(key => {
                if(Array.isArray(state[key])) state[key] = [];
                else if (typeof state[key] === 'object' && state[key] !== null) state[key] = {};
            });
            state.filtroFinanceiro = 'todos'; // Reset filtro
            // Limpa as tabelas na interface
            DOM.tabelaAlunos.innerHTML = '';
            DOM.tabelaAulas.innerHTML = '';
            DOM.tabelaPlanos.innerHTML = '';
            DOM.tabelaFormasPagamento.innerHTML = '';
            DOM.tabelaFinanceiro.innerHTML = '';
            DOM.tabelaCaixa.innerHTML = '';
            DOM.programacaoDia.innerHTML = '';
            DOM.tabelaPrevisao.innerHTML = '';
            // Limpa selects (exceto opções default)
            DOM.selectTurmaAluno.innerHTML = '<option selected disabled value="">Selecione...</option>';
            DOM.selectPlanoAluno.innerHTML = '<option selected disabled value="">Selecione...</option>';
             
        }
    }, (error) => {
        // Erro no listener de autenticação (raro, mas possível)
        console.error("Erro no listener de autenticação:", error);
        DOM.initialLoading.style.display = 'none';
        DOM.loginSection.style.display = 'block'; // Mostra login em caso de erro
        DOM.loginError.textContent = "Erro ao verificar autenticação. Tente novamente.";
        DOM.loginError.style.display = 'block';
    });
});