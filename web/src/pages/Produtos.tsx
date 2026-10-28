import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, Package, Plus, RefreshCw, Search, X } from 'lucide-react';
import { produtosApi, type Produto, type CriarProduto, ApiError } from '../services/api';

type Props = { token: string; onSessaoExpirada: () => void };
type Campos = { codigo: string; descricao: string; cor: string; acabamento: string; larguraMm: string; espessuraMm: string; unidade: string };
const inicial: Campos = { codigo: '', descricao: '', cor: '', acabamento: '', larguraMm: '', espessuraMm: '', unidade: 'UN' };

export default function Produtos({ token, onSessaoExpirada }: Props) {
  const [lista, setLista] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [formulario, setFormulario] = useState(false);
  const [campos, setCampos] = useState<Campos>({ ...inicial });
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true); setErro('');
    try { setLista(await produtosApi.listar(token)); }
    catch (e) {
      if (e instanceof ApiError && e.status === 401) { onSessaoExpirada(); return; }
      setErro(e instanceof Error ? e.message : 'Falha ao consultar produtos.');
    } finally { setLoading(false); }
  }, [token, onSessaoExpirada]);

  useEffect(() => { void carregar(); }, [carregar]);

  const filtrados = useMemo(() => {
    const q = busca.toLocaleLowerCase('pt-BR').trim();
    return lista.filter(p => [p.codigo, p.descricao, p.cor ?? '', p.acabamento ?? ''].some(v => v.toLocaleLowerCase('pt-BR').includes(q)));
  }, [lista, busca]);

  function mudar(campo: keyof Campos, valor: string) {
    setCampos(atual => ({ ...atual, [campo]: valor }));
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (salvando) return;
    setErro(''); setSucesso('');
    const codigo = campos.codigo.trim().toUpperCase();
    const descricao = campos.descricao.trim();
    if (!codigo || !descricao) { setErro('Código e descrição são obrigatórios.'); return; }
    const dimensoes: Pick<CriarProduto, 'larguraMm' | 'espessuraMm'> = {};
    for (const campo of ['larguraMm', 'espessuraMm'] as const) {
      const valor = campos[campo].trim();
      if (valor) {
        const numero = Number(valor);
        if (!Number.isSafeInteger(numero) || numero < 1) { setErro('As dimensões devem ser números inteiros maiores que zero, em mm.'); return; }
        dimensoes[campo] = numero;
      }
    }
    setSalvando(true);
    try {
      await produtosApi.criar(token, {
        codigo, descricao,
        ...(campos.cor.trim() ? { cor: campos.cor.trim() } : {}),
        ...(campos.acabamento.trim() ? { acabamento: campos.acabamento.trim() } : {}),
        ...dimensoes,
        unidade: campos.unidade.trim().toUpperCase() || 'UN',
      });
      setCampos({ ...inicial }); setFormulario(false);
      setSucesso(`Produto ${codigo} cadastrado com sucesso.`);
      await carregar();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { onSessaoExpirada(); return; }
      setErro(e instanceof Error ? e.message : 'Falha ao cadastrar produto.');
    } finally { setSalvando(false); }
  }

  return <div className="page-content">
    <div className="page-heading"><div><span className="eyebrow"><Package size={15}/> CADASTROS / PRODUÇÃO</span><h1>Produtos</h1><p className="muted">Cadastre os materiais que serão utilizados nas ordens de produção.</p></div><button className="button button-primary" onClick={() => { setErro(''); setSucesso(''); setFormulario(v => !v); }}><Plus size={18}/> {formulario ? 'Fechar cadastro' : 'Novo produto'}</button></div>
    {erro && <div className="alert alert-error produtos-alert" role="alert">{erro}</div>}
    {sucesso && <div className="alert alert-success produtos-alert" role="status"><CheckCircle2 size={18}/>{sucesso}</div>}
    {formulario && <section className="panel produtos-form-panel">
      <div className="panel-header"><div><h2>Cadastro de produto</h2><p className="muted">Código e descrição são obrigatórios. As dimensões são informadas em milímetros.</p></div><button className="button button-outline" aria-label="Fechar formulário" onClick={() => setFormulario(false)}><X size={18}/></button></div>
      <form className="form-stack" onSubmit={salvar}>
        <div className="grid-two"><div className="form-stack"><label htmlFor="p-codigo">Código *</label><input id="p-codigo" value={campos.codigo} maxLength={50} onChange={e => mudar('codigo', e.target.value)} placeholder="Ex.: PVC-001" required/></div><div className="form-stack"><label htmlFor="p-unidade">Unidade *</label><input id="p-unidade" value={campos.unidade} maxLength={10} onChange={e => mudar('unidade', e.target.value)} required placeholder="UN"/></div></div>
        <label htmlFor="p-descricao">Descrição *</label><input id="p-descricao" value={campos.descricao} maxLength={200} onChange={e => mudar('descricao', e.target.value)} placeholder="Ex.: Forro PVC Sucupira Liso" required/>
        <div className="grid-two"><div className="form-stack"><label htmlFor="p-cor">Cor / Padrão</label><input id="p-cor" value={campos.cor} maxLength={100} onChange={e => mudar('cor', e.target.value)} placeholder="Ex.: Sucupira"/></div><div className="form-stack"><label htmlFor="p-acabamento">Acabamento</label><input id="p-acabamento" value={campos.acabamento} maxLength={100} onChange={e => mudar('acabamento', e.target.value)} placeholder="Ex.: Liso"/></div></div>
        <div className="grid-two"><div className="form-stack"><label htmlFor="p-largura">Largura (mm)</label><input id="p-largura" type="number" min="1" step="1" value={campos.larguraMm} onChange={e => mudar('larguraMm', e.target.value)} placeholder="Ex.: 200"/></div><div className="form-stack"><label htmlFor="p-espessura">Espessura (mm)</label><input id="p-espessura" type="number" min="1" step="1" value={campos.espessuraMm} onChange={e => mudar('espessuraMm', e.target.value)} placeholder="Ex.: 7"/></div></div>
        <div className="form-actions"><button type="button" className="button button-outline" onClick={() => setFormulario(false)}>Cancelar</button><button type="submit" className="button button-primary" disabled={salvando}><Package size={17}/>{salvando ? 'Salvando...' : 'Cadastrar produto'}</button></div>
      </form>
    </section>}
    <section className="panel"><div className="panel-header"><div><h2>Produtos cadastrados</h2><p className="muted">{lista.length} produto(s) no PostgreSQL</p></div><button className="button button-outline" onClick={() => void carregar()} disabled={loading}><RefreshCw size={16}/>{loading ? 'Atualizando...' : 'Atualizar'}</button></div>
      <div className="produtos-search"><Search size={18}/><input aria-label="Pesquisar produtos" placeholder="Pesquisar por código, descrição, cor ou acabamento..." value={busca} onChange={e => setBusca(e.target.value)}/></div>
      <div className="table-wrap"><table><thead><tr><th>Código</th><th>Descrição</th><th>Cor</th><th>Acabamento</th><th>Dimensões</th><th>Unidade</th><th>Situação</th></tr></thead><tbody>{filtrados.map(p => <tr key={p.id}><td><strong>{p.codigo}</strong></td><td>{p.descricao}</td><td>{p.cor || '—'}</td><td>{p.acabamento || '—'}</td><td>{p.larguraMm ?? '—'} × {p.espessuraMm ?? '—'} mm</td><td>{p.unidade}</td><td>{p.ativo ? 'Ativo' : 'Inativo'}</td></tr>)}</tbody></table>{!loading && filtrados.length === 0 && <p className="muted empty-state">{busca ? 'Nenhum produto corresponde à pesquisa.' : 'Nenhum produto cadastrado ainda.'}</p>}</div>
    </section>
  </div>;
}
