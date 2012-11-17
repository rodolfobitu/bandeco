// Representa um data
function Data(dia, mes, ano, almoco) {
	var agora = new Date
	this.dia = dia===undefined ? agora.getDate() : dia
	this.mes = mes===undefined ? agora.getMonth()+1 : mes
	this.ano = ano===undefined ? agora.getFullYear() : ano
	this.almoco = almoco===undefined ? agora.getHours()<15 : almoco
	this.normalizar()
}

// Nomes dos dias da semana
Data.dias = "domingo,segunda,terça,quarta,quinta,sexta,sábado".split(",")

// Retorna a data na forma dd/mm/YYYY
Data.prototype.toString = function () {
	var dia = String(this.dia), mes = String(this.mes), ano = String(this.ano)
	dia = this.dia<10 ? "0"+dia : dia
	mes = this.mes<10 ? "0"+mes : mes
	ano = this.ano<10 ? "0"+ano : ano
	return dia+"/"+mes+"/"+ano
}

// Retorna no formato A-dd/mm/YYYY
Data.prototype.getHash = function () {
	return (this.almoco ? "A" : "J")+"-"+String(this)
}

// Retorna o nome do dia da semana
Data.prototype.getDiaSemana = function () {
	return Data.dias[this.getDate().getDay()]
}

// Retorna um objeto Date relativo à essa data
Data.prototype.getDate = function () {
	return new Date(this.ano, this.mes-1, this.dia, this.almoco ? 12 : 18)
}

// Avança a data
Data.prototype.avancar = function () {
	if (!this.almoco)
		this.dia++
	this.almoco = !this.almoco
	this.normalizar()
}

// Retrocede a data
Data.prototype.voltar = function () {
	if (this.almoco)
		this.dia--
	this.almoco = !this.almoco
	this.normalizar(-1)
}

// Normaliza a data para um valor válido (que exista e seja dia de semana)
// Ex: 0/7/2012 => 30/6/2012 (sáb) => 2/7/2012 (seg)
// sentido (-1 ou 1) indica para que lado irá quando cair num fim de semana (padrão: 1)
Data.prototype.normalizar = function (sentido) {
	var date = this.getDate()
	sentido = sentido || 1
	while (date.getDay()%6 == 0) {
		this.almoco = sentido>0
		date.setTime(date.getTime()+sentido*24*60*60*1e3)
	}
	this.dia = date.getDate()
	this.mes = date.getMonth()+1
	this.ano = date.getFullYear()
}