/*

Camada de abstração do ajax
Versão 1.3 - 23/04/2012
Guilherme de Oliveira Souza
http://sitegui.com.br

Recebe como parâmetro um objeto com as seguintes propriedades (todas são opcionais):
- url: o endereço alvo. Pode conter informações GET
- funcao: a função que será executada após uma resposta do servidor.
  Ela irá receber como parâmetro o retorno do servidor
- dados: os dados a serem enviados via GET ou POST.
  Pode ser uma string na forma "var=valor&var2=valor2" ou um objeto com propriedades
  Caso alguma propriedade seja um objeto, ele será transformado em string JSON por JSON.stringify
- metodo: define o método de comunicação ("GET" ou "POST")
- timeout: define o tempo máximo em segundos de espera até retornar um erro (0 significa sem limite)
- retorno: define o tipo de retorno esperado ("text", "xml" ou "json")
- cache: define se permite um retorno direto do cache do browser
- funcaoErro: função que será chamada em caso de erro. Recebe como parâmetro uma exceção caso tenha ocorrido alguma
- funcaoTimeout: funcao que será executada quando a conexão extrapolar o tempo limite

Retorna o objeto XMLHttpRequest
Esse objeto têm um método a mais, "abortar", que permite abortar segurante a requisição

Nas funções, this se refere ao objeto XMLHttpRequest

Os valores padrões são:
{"url" : "",
"funcao" : function () {},
"dados" : "",
"metodo" : "GET",
"timeout" : 30,
"retorno" : "text",
"cache" : false,
"funcaoErro" : function (e) {alert("Erro na conexão");console.log(this);console.log(e)},
"funcaoTimeout" : this.funcaoErro}

=== Changelog ===

	== 1.2 ==
		- Se alguma propriedade do parâmetro dados for um objeto, ele será codificado em JSON com JSON.stringify
		- O objeto this dentro das funções funcao, funcaoErro, funcaoTimeout agora se referem ao objeto XMLHttpRequest (antes era window)
		- A funcaoErro recebe como parâmetro uma exceção caso tenha ocorrido uma
		- O padrão da funcaoErro agora usa console.log para mostrar ao programador o que deu de errado
		- Caso a opção retorno não seja nenhum dentre "text", "xml", "json", será assumido "text" (antes era "json")
	
	== 1.3 ==
		- Timeout voltou a funcionar
		- O objeto ajax retornado não é mais poluído com referências aos argumentos
		- O objeto ajax agora possui um método "abortar" que funciona de modo semelhante ao "abort", porém evita timeouts errôneos
*/

function Ajax(opcoes) {
	// Recebe os parâmetros
	var temp, i, valor, ajax, intervalo = null
	opcoes = opcoes || {}
	opcoes.url = opcoes.url || ""
	opcoes.funcao = opcoes.funcao || function () {}
	opcoes.dados = opcoes.dados || ""
	opcoes.metodo = (opcoes.metodo || "get").toUpperCase()
	opcoes.timeout = opcoes.timeout===undefined ? 30 : opcoes.timeout
	opcoes.retorno = (opcoes.retorno || "text").toLowerCase()
	opcoes.cache = Boolean(opcoes.cache)
	opcoes.funcaoErro = opcoes.funcaoErro || function (e) {
		alert("Erro na conexão")
		console.log(this)
		console.log(e)
	}
	opcoes.funcaoTimeout = opcoes.funcaoTimeout || opcoes.funcaoErro
	
	// Prepara os dados
	if (typeof(opcoes.dados) == "object") {
		temp = []
		for (i in opcoes.dados)
			if (opcoes.dados.hasOwnProperty(i)) {
				valor = typeof(opcoes.dados[i])=="object" ? JSON.stringify(opcoes.dados[i]) : String(opcoes.dados[i])
				temp.push(encodeURIComponent(i)+"="+encodeURIComponent(valor))
			}
		opcoes.dados = temp.join("&")
	}
	
	// Prepara a url
	if (!opcoes.cache)
		opcoes.url = opcoes.url+(opcoes.url.indexOf("?")==-1 ? "?" : "&")+"noCache="+(new Date).getTime()
	if (opcoes.metodo == "GET" && opcoes.dados != "")
		opcoes.url = opcoes.url+(opcoes.url.indexOf("?")==-1 ? "?" : "&")+opcoes.dados
	
	// Cria o objeto
	ajax = new XMLHttpRequest()
	ajax.open(opcoes.metodo, opcoes.url, true)
	ajax.onreadystatechange = function () {
		var resposta, erro = false
		if (this.readyState == 4) {
			clearInterval(intervalo)
			if (this.status == 200) {
				try {
					resposta = opcoes.retorno=="json" ? JSON.parse(this.responseText) : (opcoes.retorno=="xml" ? this.responseXML : this.responseText)
				} catch (e) {
					// Erro no XML ou JSON
					opcoes.funcaoErro.call(this, e)
					erro = true
				}
				if (!erro)
					opcoes.funcao.call(this, resposta)
			} else
				opcoes.funcaoErro.call(this)
			ajax.onreadystatechange = null
		}
	}
	
	// Permite abortar a requisição
	ajax.abortar = function () {
		clearInterval(intervalo)
		ajax.onreadystatechange = null
		ajax.abort()
	}
	
	// Cria o timeout
	if (opcoes.timeout)
		intervalo = setTimeout(function () {
			opcoes.funcaoTimeout.call(ajax)
			ajax.abortar()
		}, opcoes.timeout*1000)
	
	// Envia o pedido
	if (opcoes.metodo == "POST") {
		ajax.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
		ajax.send(opcoes.dados)
	} else
		ajax.send()
	
	// Retorna
	return ajax
}
