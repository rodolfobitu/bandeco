/*

Bandeco
Versão 3.0 - 16/11/2012
Guilherme de Oliveira Souza
http://sitegui.com.br

*/

var _url = "http://sitegui.com.br/apis/bandeco2/", _dados = localStorage.getItem("bandecoDados")
var _data = null

// Canal usado para as requisições GET
var _canal = new CanalAjax

// Armazena todos os dados da aplicação
if (_dados != null)
	_dados = JSON.parse(_dados)
if (_dados == null || !("versao" in _dados) || _dados.versao != 3.1)
	_dados = {versao: 3.1, ra: "", cache: {}, votos: []}

onbeforeunload = function () {
	localStorage.setItem("bandecoDados", JSON.stringify(_dados))
}

// Pede pelo RA da pessoa
// Se forcar for true, força o pedido do RA (mesmo quando já foi informado)
// Retorna false caso o RA não tenha sido fornecido
function pedirRA(forcar) {
	var ra
	if (!_dados.ra || forcar) {
		ra = prompt("Qual seu RA?\n(Você precisa fornece-lo para poder votar nas refeições)", _dados.ra)
		if (ra === null)
			return false
		_dados.ra = ra
	}
	return true
}

// Mostra a janela
function mostrarJanela(html) {
	get("conteudoJanela").innerHTML = html
	get("janela").style.display = ""
}

// TODO: implementar
var mostrarRank, mostrarSemana

// Inicia
onload = function () {
	var hash
	
	// Coloca os listeners nos botões
	get("cog").onclick = Menu.abrir([["Ver ranking", mostrarRank], ["Mudar RA", function () {
		pedirRA(true)
		// TODO: recarregar tudo
	}], ["Gerar URL", gerarURL]])
	get("help").onclick = Menu.abrir([["Sobre", function () {
		mostrarJanela(get("sobre").innerHTML)
	}], ["Fale Conosco", function () {
		window.open("http://sitegui.com.br/fale_conosco/?assunto=bandeco", "janelaFaleConosco", "width=500,height=500")
	}], ["Sitegui", function () {
		window.open("http://sitegui.com.br")
	}], ["API Bandeco", function () {
		window.open("http://sitegui.com.br/apis/bandeco")
	}]])
	get("data").onclick = Menu.abrir([["Ver semana", mostrarSemana], ["Ir para data", function () {
		// TODO: perguntar a data
	}]])
	
	// Lê o comando inicial pela hash
	// Formato de exemplo: #J-16/11/2012;tpjfiOrqzOUgrjbi8B85
	// A chave é usada para configurar as opções de aviso
	// A data pode estar incompleta da direita para a esquerda
	hash = location.hash.match(/^#(?:([AJ])(?:-(\d{2})(?:\/(\d{2})(?:\/(\d{4}))?)?)?)?(?:;(.{20}))?$/i)
	_data = new Data
	if (hash) {
		if (hash[1]) _data.almoco = hash[1].toUpperCase()=="A"
		if (hash[2]) _data.dia = Number(hash[2])
		if (hash[3]) _data.mes = Number(hash[3])
		if (hash[4]) _data.ano = Number(hash[4])
		_data.normalizar()
	}
	
	// Exibe o cardápio
	mostrar()
	
	/*/ Carrega o cenário inicial
	var hash = verHash()
	if (dados.refeicaoAtual)
		montar(dados.refeicaoAtual, true)
	if (navigator.onLine) {
		if (ajax)
			ajax.abortar()
		ajax = Ajax({url: url+"cardapio?ra="+dados.ra,
		dados: hash,
		retorno: "json",
		funcao: montar,
		funcaoErro: function () {
			document.body.style.cursor = ""
		}})
		dados.delta = 0
		document.body.style.cursor = "progress"
	}*/
}

// Exibe o cardápio (usa o valor global da data)
function mostrar() {
	var dados, tempo = 0, diferenca
	
	// Atualiza a data da interface
	get("data").textContent = (_data.almoco ? "Almoço" : "Janta")+" de "+_data.getDiaSemana()+" ("+_data+")"
	
	// Busca no cache
	if (_data.getHash() in _dados.cache) {
		tempo = _dados.cache[_data.getHash()].tempo
		Aviso.avisar("Atualizado "+tempo2String(tempo), 1e3)
		exibirRefeicao(_dados.cache[_data.getHash()].refeicao)
	}
	
	if (Date.now()-tempo > 30*60*1e3) {
		// Busca a versão atualizada
		dados = {dia: _data.dia, mes: _data.mes, ano: _data.ano, almoco: _data.almoco, ra: _dados.ra}
		_canal.enviarDireto({url: _url+"cardapio", dados: dados, retorno: "JSON", funcao: function (refeicao) {
			var data
			if (refeicao === null)
				// Sem mais dados
				Aviso.falhar("Nenhuma refeição mais", 3e3)
			else {
				data = new Data(refeicao.data.dia, refeicao.data.mes, refeicao.data.ano)
				if (data.getHash() != _data.getHash())
					// Não é o que foi pedido, descarta
					refeicao = null
				
				// Armazena e exibe
				_dados.cache[_data.getHash()] = {refeicao: refeicao, tempo: Date.now()}
				exibirRefeicao(refeicao)
				Aviso.avisar("Atualizado!", 1e3)
			}
		}, funcaoErro: function () {
			Aviso.falhar("Falha na conexão", 3e3)
		}})
	}
}

// Mostra todos os dados da refeição na interface
function exibirRefeicao(refeicao) {
	if (refeicao === null)
		get("principal").innerHTML = "<em>Sem nada</em>"
	else
		get("principal").textContent = refeicao.prato.nome
}

// Forma uma URL direto para essa página
function gerarURL() {
	var html, url
	url = location.protocol+"//"+location.host+location.pathname+"#"+_data.getHash()
	html = "Essa URL irá trazer direto para o cardápio do dia "+_data+":<br><span id='tempInput'>"+url+"</span>"
	mostrarJanela(html)
	setTimeout(function () {
		var range = document.createRange()
		range.selectNode(get("tempInput"))
		getSelection().removeAllRanges()
		getSelection().addRange(range)
	}, 100)
}

// Atalho para document.getElementById
function get(id) {
	return document.getElementById(id)
}

// Transforma um valor de tempo em uma string facilmente entendível
// Date.now()-60e3 => "há 1 minuto"
function tempo2String(tempo) {
	var s = Math.floor((Date.now()-tempo)/1e3)
	var min = Math.floor(s/60)
	var h = Math.floor(min/60)
	var dia = Math.floor(h/24)
	s %= 60
	min %= 60
	h %= 24
	if (dia > 0)
		return "há "+dia+" dia"+(dia==1 ? "" : "s")
	else if (h > 0)
		return "há "+h+" hora"+(h==1 ? "" : "s")
	else if (min > 0)
		return "há "+min+" minuto"+(min==1 ? "" : "s")
	return "há "+s+" segundo"+(s==1 ? "" : "s")
}

// Avança e retorna no tempo
function avancar() {
	_data.avancar()
	mostrar()
}
function voltar() {
	_data.voltar()
	mostrar()
}

/*
setInterval(function () {
	if (navigator.onLine) {
		if (ajax)
			ajax.abortar()
		ajax = Ajax({url: url+"cardapio?ra="+dados.ra,
		retorno: "json",
		funcao: montar,
		funcaoErro: function () {
			document.body.style.cursor = ""
		}})
		dados.delta = 0
		document.body.style.cursor = "progress"
	}
}, 3600e3)
onkeydown = function (e) {
	if (e.keyCode == 39)
		avancar()
	else if (e.keyCode == 37)
		voltar()
}

// Mostra o cardápio da semana
function mostrarSemana() {
	document.body.style.cursor = "progress"
	if (ajax)
		ajax.abortar()
	ajax = Ajax({url: url+"semana",
	dados: {ra: dados.ra},
	retorno: "json",
	funcao: function (refeicoes) {
		var i, data, data2, html = "<br><table><tr><td>Data</td><td>Prato</td><td>Nota</td><td>Sobremesa</td></tr>"
		document.body.style.cursor = ""
		for (i=0; i<refeicoes.length; i++) {
			data = new Date(refeicoes[i].data.ano, refeicoes[i].data.mes-1, refeicoes[i].data.dia, 15, 0, 0, 0)
			data = dias[data.getDay()]
			data2 = refeicoes[i].data.dia.getCom2Digitos()+"/"+refeicoes[i].data.mes.getCom2Digitos()
			html += "<tr><td>"+(refeicoes[i].data.almoco ? "Almoço" : "Janta")+" de "+data+" <span style='font-size:smaller'>("+data2+")</span></td>"
			html += "<td>"+refeicoes[i].prato.nome.upperCaseFirst()+"</td>"
			if (refeicoes[i].prato.numVotos)
				html += "<td title='"+refeicoes[i].prato.numVotos+" votos'>"+Math.round(refeicoes[i].prato.nota*100)/100+" "+imgTag(refeicoes[i].prato.nota)+
				"</td>"
			else
				html += "<td>-</td>"
			html += "<td>"+refeicoes[i].sobremesa.upperCaseFirst()+"</td></tr>"
		}
		mostrarJanela(html)
	},
	funcaoErro: function () {
		document.body.style.cursor = ""
		alert("Erro na conexão")
	}})
}

// Mostra o rank dos pratos
function mostrarRank() {
	document.body.style.cursor = "progress"
	if (ajax)
		ajax.abortar()
	ajax = Ajax({url: url+"ranking",
	dados: {ra: dados.ra, quantidade: 50},
	retorno: "json",
	funcao: function (pratos) {
		var i, html = "<br><table><tr><td>Pos</td><td>Prato</td><td>Nota</td></tr>"
		document.body.style.cursor = ""
		for (i=0; i<pratos.length; i++) {
			html += "<tr><td>"+(i+1)+"º</td><td>"+pratos[i].nome.upperCaseFirst()+"</td><td title='"+pratos[i].numVotos+" votos'>"+Math.round(pratos[i].nota*100)/100+
			"</td></tr>"
		}
		mostrarJanela(html)
	},
	funcaoErro: function () {
		document.body.style.cursor = ""
		alert("Erro na conexão")
	}})
}

// Mudanças na hash
function verHash() {
	var hash = location.hash, data = {}
	if (hash.match(/^#[0-9]{8}[aj]$/)) {
		data.dia = hash.substr(1, 2)
		data.mes = hash.substr(3, 2)
		data.ano = hash.substr(5, 4)
		data.almoco = hash.substr(9)=="a"
	}
	return data
}

// Deixa a primeira letra em maiúscula
Object.defineProperty(String.prototype, "upperCaseFirst", {value: function () {
	return this.charAt(0).toUpperCase()+this.substr(1)
}})

// Coloca um "0" antes se preciso
Object.defineProperty(Number.prototype, "getCom2Digitos", {value: function () {
	var s = String(this)
	return s.length<2 ? "0"+s : s
}})

// Retorna a tag HTML para a imagem do smile que representa a nota dada
function imgTag(nota) {
	nota = Math.round(nota)
	return "<img src='"+nota+".png' title='"+nota+"'>"
}

// Monta a interface para refletir os dados da refeição
function montar(refeicao, veioDoHistorico) {
	var date, data, atual, html, i, el, nota
	
	document.body.style.cursor = ""
	if (refeicao === null) {
		alert("Sem dados")
		dados.delta -= sentido
		return
	}
	dados.refeicaoAtual = refeicao
	
	// Atualiza a hash
	location.hash = "#"+refeicao.data.dia.getCom2Digitos()+refeicao.data.mes.getCom2Digitos()+refeicao.data.ano+(refeicao.data.almoco ? "a" : "j")
	
	// Formata a data
	atual = refeicao.data
	date = new Date(atual.ano, atual.mes-1, atual.dia)
	data = (atual.almoco ? "Almoço" : "Janta")+" de "+dias[date.getDay()]+" ("+atual.dia.getCom2Digitos()+"/"+atual.mes.getCom2Digitos()+")"
	get("data").innerHTML = data
	
	// Mostra os dados da refeição
	get("principal").innerHTML = refeicao.prato.nome.upperCaseFirst()
	get("guarnicao").innerHTML = refeicao.guarnicao.upperCaseFirst()
	if (refeicao.sobremesa && refeicao.suco)
		get("sobremesaESuco").innerHTML = refeicao.sobremesa.upperCaseFirst()+" e suco de "+refeicao.suco
	else if (refeicao.sobremesa)
		get("sobremesaESuco").innerHTML = refeicao.sobremesa.upperCaseFirst()
	else if (refeicao.suco)
		get("sobremesaESuco").innerHTML = "Suco de "+refeicao.suco
	else
		get("sobremesaESuco").innerHTML = ""
	
	// Mostra as notas
	if (refeicao.prato.nota !== null) {
		nota = refeicao.prato.nota
		if (refeicao.prato.familia)
			nota = (nota+refeicao.prato.familia.nota)/2
		html = "Nota: <span title='"+refeicao.prato.numVotos+" votos'>"+nota.toFixed(1)+"</span> "+imgTag(nota)
		if (refeicao.prato.notaPessoal !== null)
			html += " (para você: "+refeicao.prato.notaPessoal.toFixed(1)+")"
		get("nota").innerHTML = html
	} else
		get("nota").innerHTML = "<span style='font-size:small'>Sem notas ainda</span>"
	
	// Mostra a votação
	for (i=0; i<5; i++) {
		el = get("voto"+i)
		el.classList[refeicao.podeVotar ? "add" : "remove"]("botao")
		if (refeicao.notaPessoal == i-2)
			el.classList.add("destaque")
		else
			el.classList.remove("destaque")
	}
	
	// Monta o histórico
	if (ajax)
		ajax.abortar()
	if (veioDoHistorico) {
		montarPrato(dados.info)
		return
	}
	get("historico").innerHTML = "..."
	ajax = Ajax({url: url+"infoPrato",
	dados: {prato: refeicao.prato.id, ra: dados.ra},
	retorno: "json",
	funcao : montarPrato})
}

// Monta as informações do prato
function montarPrato(info) {
	var i, html = [], nota, dia, mes, ano
	dados.info = info
	for (i=0; i<5 && i<info.historico.length; i++) {
		if (info.historico[i].id == dados.refeicaoAtual.id)
			continue;
		nota = info.historico[i].nota
		dia = info.historico[i].data.dia.getCom2Digitos()
		mes = info.historico[i].data.mes.getCom2Digitos()
		ano = info.historico[i].data.ano
		html.push("<span title='Em "+ano+", "+(nota===null ? "sem nota" : "nota: "+nota)+"' class='botao' onclick='irHistorico("+i+")'>"+
			dia+"/"+mes+" "+(info.historico[i].data.almoco ? "no almoço" : "na janta")+"</span>")
	}
	get("historico").innerHTML = html.length ? "Histórico: "+html.join(", ") : "Histórico desconhecido"
	
	// Coloca o rank
	if (info.rank.posicao)
		get("nota").innerHTML += " ("+info.rank.posicao+"º dentre "+info.rank.total+")"
}

// Vai para uma refeição do histórico
function irHistorico(i) {
	montar(dados.info.historico[i], true)
}

// Vota na refeição
function votar(num) {
	if (!dados.refeicaoAtual.podeVotar || !pedirRA())
		return;
	document.body.style.cursor = "progress"
	Ajax({url: url+"votar",
	dados: {refeicao: dados.refeicaoAtual.id, ra: dados.ra, voto: num},
	metodo: "POST",
	retorno: "json",
	funcao: function (resultado) {
		document.body.style.cursor = ""
		if (resultado) {
			carregar()
		}
	}})
}

// Carrega a refeição com base no "delta" global
function carregar() {
	document.body.style.cursor = "progress"
	if (ajax)
		ajax.abortar()
	ajax = Ajax({url: url+"cardapio",
	dados: {delta: dados.delta, ra: dados.ra},
	retorno: "json",
	funcao: montar,
	funcaoErro: function () {
		dados.delta -= sentido
		document.body.style.cursor = ""
		alert("Erro na conexão")
	}})
}

// Carrega a próxima refeição
function avancar() {
	sentido = 1
	dados.delta++
	carregar()
}

// Carrega a refeição anterior
function voltar() {
	sentido = -1
	dados.delta--
	carregar()
}
*/