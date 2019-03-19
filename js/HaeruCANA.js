$(document).ready(function () {
	if (!localStorage.getItem("astInfoToggle")) {
		localStorage.setItem("astInfoToggle", true)
	}
	astInfoCheckFlag = localStorage.getItem("astInfoToggle")
	calHeight(astInfoCheckFlag)
	
		
		setInterval(function(){
			$('#8D2,#1CE4,#76,#DE5,#1D0C,#1D60,#1D1A,#B45').find('.num').each(function(){
				var sec = parseInt($(this).text())
				if(sec != 0 && !isNaN(sec))
					$(this).text(sec - 1)
				if(sec == 0)
					clearInterval(actionCode)
			})
		}, 1000);
});


$(window).resize(function () {
	calHeight(astInfoCheckFlag)
});

function calHeight(flag) {
	if (flag == 'true') {
		$('.scrollArea').css('height', '-webkit-calc(100vh - 210px)')
		$('.ast').show()
		$('#astInfo').text("Hide")
	} else {
		$('.scrollArea').css('height', '-webkit-calc(100vh - 90px)')
		$('.ast').hide()
		$('#astInfo').text("Show")
	}
	localStorage.setItem("astInfoToggle", flag)
	astInfoCheckFlag = flag
}


function reset(flag) {
	autoResetFlag = true
	switch (flag) {
		case "endEncounter":
			startFlag = false
			break
		case "astInfo":
			if (astInfoCheckFlag == 'true')
				calHeight('false')
			else
				calHeight('true')
			break
		case "btn":
			AstData = new Object()
			$("#E06,#1D18,#E07,#E08,#E09,#1D13,#391,#392,#393,#394,#395,#396,#1D14,#1D15").find('.num').text(0)			
			$("#8D2,#1CE4,#76,#DE5,#1D0C,#1D60,#1D1A,#B45").find('.num').text('-')
			$('.scrollArea').html('');
			if (!lastDataActive && !$('#notice').length)
				$('#target').text('[--:--] 초기화 완료!')
			$('#member').html('')
			startFlag = false
			initFlag = true
			break
		case "autoReset":
			AstData = new Object()
			$("#E06,#1D18,#E07,#E08,#E09,#1D13,#391,#392,#393,#394,#395,#396,#1D14,#1D15").find('.num').text(0)		
			$("#8D2,#1CE4,#76,#DE5,#1D0C,#1D60,#1D1A,#B45").find('.num').text('-')
			$('.scrollArea').html('');
			if (!lastDataActive && !$('#notice').length)
				$('#target').text('[--:--] 초읽기·전투 시작을 인식!')
			$('#member').html('')
			startFlag = true
			break
	}
}


$(document).on('mouseover', '.btn_ast', function () {
	changeList(this.id)
	$('#member').find('span').removeClass('on')
	$('#' + this.id).addClass('on')
});


function changeList(id) {
	var actionCode = ["E06", "1D18", "E07", "E08", "E09", "1D13", "391", "392", "393", "394", "395", "396", "1D14", "1D15"]
	for (var j in actionCode) {
		if (j < 6)
			$('#' + actionCode[j]).find('.num').text(AstData[id].cardAction[actionCode[j]])
		else
			$('#' + actionCode[j]).find('.num').text(AstData[id].cardCount[actionCode[j]])
	}
}



function BeforeLogLineRead(e) {
	var lastLog = JSON.parse(e)    
	switch (lastLog.msgtype) {
		case "SendCharName":
			myName = lastLog.msg.charName
			break
		case "AddCombatant":
			if (lastLog.msg.job == 33 && lastLog.msg.name == myName)
				myJob = 'AST';
			break
		case "CombatData":
			lastData = lastLog.msg  
			
			if (lastData.isActive) {
				lastDataActive = true
				
				$('#notice').remove()
				if (!$('#notice').length)
					$('#target').text('[' + lastData.Encounter.duration + '] ' + lastData.Encounter.title)
				
				if (lastData.Encounter.title == "Encounter") {
					if (startFlag == false) {
						reset('autoReset')
						startFlag = true
					}
				}
			} else {
				if (!$('#notice').length)
					$('#target').text('[' + lastData.Encounter.duration + '] ' + lastData.Encounter.title)
				startFlag = false
				reset('endEncounter')
				lastDataActive = false
			}
			break
		case "Chat":
			var startLog1 = /^(전투 시작 \d\d초 전\! \((.*?)\))$/im
			var startLog2 = /^(전투 시작 \d초 전\! \((.*?)\))$/im
			var startLog3 = /^(전투 시작\!)$/im
			var cancelLog = /^((.*?) 님이 초읽기를 취소했습니다.)/im

			
			if (lastLog.msg.split("|")[0] == '00') {
				if (lastLog.msg.split("|")[4].match(startLog1) || lastLog.msg.split("|")[4].match(startLog2)) {
					if (autoResetFlag && !lastDataActive) {
						reset('autoReset')
						autoResetFlag = false
					}
					initFlag = false
				}
				else if (lastLog.msg.split("|")[4].match(cancelLog))
					reset('btn')
				else if (lastLog.msg.split("|")[4].match(startLog3)) {
					if (!lastDataActive && !$('#notice').length && !initFlag) {
						$('#target').text('[--:--] 전투 시작!')
					}
				}
			}
			
			
			if (lastLog.msg.split("|")[0] == '30' || lastLog.msg.split("|")[0] == '26') {
				var from = lastLog.msg.split("|")[6]
				var name = from.replace(/ /g, "").replace(/'/g, "_")
				var actionName = lastLog.msg.split("|")[3]

				if ((actionName == "왕도: 효과 향상" || actionName == "왕도: 범위화" || actionName == "왕도: 지속시간 증가")) {
					getLog(from, '', getActionCode(actionName), actionName)
					if (lastLog.msg.split("|")[0] == '30') {
						if (AstData[name].use)
							AstData[name].use = false
						else
							AstData[name].loyalRoad = "단일"
					}
				}
			}
			
			if (startFlag) {
				
				if (lastLog.msg.split("|")[0] == '21' || lastLog.msg.split("|")[0] == '22') {
					var from = lastLog.msg.split("|")[3]
					var to = lastLog.msg.split("|")[7]
					var actionName = lastLog.msg.split("|")[5]
					var actionCode = lastLog.msg.split("|")[9]
					
					if (actionName == '시간 지연' || actionName == '용의 시선')
						getLog(from, to, actionCode, actionName)
					
					else if (actionName == '아제마의 균형' || actionName == '세계수의 줄기' || actionName == '오쉬온의 화살' || actionName == '할로네의 창' || actionName == '살리아크의 물병' || actionName == '비레고의 탑') {
						var name = createAst(from)
						if (AstData[name].loyalRoad != '광역')
							AstData[name].to = to
						AstData[name].use = true
					}
					else if (actionName == '묘수') {
						var name = createAst(from)
						AstData[name].use = false
					}
				}
				
				else if (lastLog.msg.split("|")[0] == '00') {
					var log3 = /^((.*?)(이|가) (여왕의 날개|왕의 검|위상 변화|소 아르카나|보류|점지|묘수|왕도|아제마의 균형|세계수의 줄기|오쉬온의 화살|할로네의 창|살리아크의 물병|비레고의 탑|천궁의 반목)(을|를) 시전했습니다.)$/im
					var log4 = /^((.*?)(이|가) (속임수 공격|전투 기도|과충전|연환계|전장의 노래|성원|도원결의|마인의 진혼곡|에기의 가호)(을|를) 시전했습니다.)$/im

					if (lastLog.msg.split("|")[4].match(log3)) {
						var from = lastLog.msg.split("|")[4].match(log3)[2]
						if (from.indexOf("") > -1)
							from = from.split("")[1].split("")[0]
						var name = from.replace(/ /g, "").replace(/'/g, "_")
						var actionName = lastLog.msg.split("|")[4].match(log3)[4]
						getLog(from, '', getActionCode(actionName), actionName)
					} else if (lastLog.msg.split("|")[4].match(log4)) {
						var from = lastLog.msg.split("|")[4].match(log4)[2]
						if (from.indexOf("") > -1)
							from = from.split("")[1].split("")[0]
						var name = from.replace(/ /g, "").replace(/'/g, "_")
						var actionName = lastLog.msg.split("|")[4].match(log4)[4]
						if (actionName == "속임수 공격" || actionName == "전투 기도" || actionName == "과충전" || actionName == "연환계" || actionName == "전장의 노래" || actionName == "성원" || actionName == "도원결의" || actionName == "마인의 진혼곡" || actionName == "에기의 가호")
							createTimeline(from, '', getActionCode(actionName), actionName)
					}
				}
				
				else if (lastLog.msg.split("|")[0] == '26') {
					var from = lastLog.msg.split("|")[6]
					var actionName = lastLog.msg.split("|")[3]
					if (actionName == "보류: 아제마의 균형" || actionName == "보류: 세계수의 줄기" || actionName == "보류: 오쉬온의 화살" || actionName == "보류: 할로네의 창" || actionName == "보류: 살리아크의 물병" || actionName == "보류: 비레고의 탑" || actionName == "점지: 아제마의 균형" || actionName == "점지: 세계수의 줄기" || actionName == "점지: 오쉬온의 화살" || actionName == "점지: 할로네의 창" || actionName == "점지: 살리아크의 물병" || actionName == "점지: 비레고의 탑")
						getLog(from, '', getActionCode(actionName), actionName)
				}
			}
			break
	}
}



function getLog(from, to, actionCode, actionName) {
	if (actionName != "용의 시선")
		var name = createAst(from)

	switch (actionCode) {
		case "330":
			AstData[name].loyalRoad = "강화"; break
		case "331":
			AstData[name].loyalRoad = "광역"; break
		case "332":
			AstData[name].loyalRoad = "지속"; break

		case "398":
			AstData[name].keep = "391"; break
		case "399":
			AstData[name].keep = "392"; break
		case "39A":
			AstData[name].keep = "393"; break
		case "39B":
			AstData[name].keep = "394"; break
		case "39C":
			AstData[name].keep = "395"; break
		case "39D":
			AstData[name].keep = "396"; break

		
		
		case "391": case "392": case "393": case "394": case "395": case "396": case "1D14": case "1D15":
			AstData[name].cardCount[actionCode]++;
			$('#member').find('span').removeClass('on')
			if (myJob == "AST" && myName == from) {
				$('#' + actionCode).find('.num').text(AstData[name].cardCount[actionCode])
				$('#' + name).addClass('on')
				changeList(name)
			} else {
				$('#' + actionCode).find('.num').text(AstData[name].cardCount[actionCode])
				$('#member').find('span').removeClass('on')
				$('#' + name).addClass('on')
				changeList(name)
			}
			break

		
		case "E06": case "1D18": case "E07": case "E08": case "E09": case "1D13":
			AstData[name].cardAction[actionCode]++;
			$('#member').find('span').removeClass('on')
			if (myJob == "AST" && myName == from) {
				$('#' + actionCode).find('.num').text(AstData[name].cardAction[actionCode])
				$('#' + name).addClass('on')
				changeList(name)
			} else {
				$('#' + actionCode).find('.num').text(AstData[name].cardAction[actionCode])
				$('#member').find('span').removeClass('on')
				$('#' + name).addClass('on')
				changeList(name)
			}
			
			if (actionCode == '1D18') {
				getLog(from, '', AstData[name].keep, '')
				AstData[name].keep = ''
			}
			break

		
		
		case "33D": case "33E": case "33F": case "340": case "341": case "342":
		case "F0000": case "A0000": case "5AE0000":
			createTimeline(from, to, actionCode, actionName)
			break
	}
}

function getActionCode(actionName) {
	switch (actionName) {
		case "왕도: 효과 향상": return "330"
		case "왕도: 범위화": return "331"
		case "왕도: 지속시간 증가": return "332"

		case "점지": return "E06"
		case "묘수": return "1D18"
		case "왕도": return "E07"
		case "보류": return "E08"
		case "위상 변화": return "E09"
		case "소 아르카나": return "1D13"

		case "천궁의 반목": return "A0000"
		case "시간 지연": return "F0000"
		case "용의 시선": return "5AE0000"

		case "아제마의 균형": return "33D"
		case "세계수의 줄기": return "33E"
		case "오쉬온의 화살": return "33F"
		case "할로네의 창": return "340"
		case "살리아크의 물병": return "341"
		case "비레고의 탑": return "342"

		case "점지: 아제마의 균형": return "391"
		case "점지: 세계수의 줄기": return "392"
		case "점지: 오쉬온의 화살": return "393"
		case "점지: 할로네의 창": return "394"
		case "점지: 살리아크의 물병": return "395"
		case "점지: 비레고의 탑": return "396"
		case "왕의 검": return "1D14"
		case "여왕의 날개": return "1D15"

		case "보류: 아제마의 균형": return "398"
		case "보류: 세계수의 줄기": return "399"
		case "보류: 오쉬온의 화살": return "39A"
		case "보류: 할로네의 창": return "39B"
		case "보류: 살리아크의 물병": return "39C"
		case "보류: 비레고의 탑": return "39D"

		case "전장의 노래": return "76"
		case "속임수 공격": return "8D2"
		case "전투 기도": return "DE5"
		case "과충전": return "B45"
		case "연환계": return "1D0C"
		case "성원": return "1D60"
		case "도원결의": return "1CE4"
		case "마인의 진혼곡": return "73"
		case "에기의 가호": return "1D1A"
	}
}




function createTimeline(from, to, actionCode, actionName) {
	var name = from.replace(/ /g, "").replace(/'/g, "_")
	var arrow = '→'
	var eff = ''

	if (lastDataActive)
		var duration = lastData.Encounter.duration;
	else
		var duration = "--:--"

	switch (actionCode) {
		case "F0000": case "A0000": case "5AE0000": 
			
			if (actionCode == "A0000") {
				to = ''
				arrow = ''
			}
			var html = '<table><tr>'
				+ '<td class="cell_1 cnt">' + duration + '</td>'
				+ '<td class="cell_1"><img src="img/' + actionCode + '.png"></td>'
				+ '<td class="cell_2">' + actionName + '</td>'
				+ '<td class="cell_4"></td>'
				+ '<td class="cell_3 from"><span class="cnt">' + from + '</span></td>'
				+ '<td class="cell_1 cnt">' + arrow + '</td>'
				+ '<td class="cell_3 to">' + to + '</td>'
				+ '</tr></table><div class="underline"></div>';

			$('#notice').remove()
			$('.scrollArea').prepend(html);
			break
		case "33D": case "33E": case "33F": case "340": case "341": case "342":
			
			console.log(AstData[name].loyalRoad)
			if (AstData[name].loyalRoad == "강화")
				eff = 'eff2'
			else if (AstData[name].loyalRoad == "지속")
				eff = 'eff3'
			else if (AstData[name].loyalRoad == "광역") {
				arrow = ''
				AstData[name].to = ''
				eff = 'eff4'
			}
			else
				eff = 'eff1'
			var html = '<table><tr>'
				+ '<td class="cell_1 cnt">' + duration + '</td>'
				+ '<td class="cell_1"><img src="img/' + actionCode + '.png"></td>'
				+ '<td class="cell_2">' + actionName + '</td>'
				+ '<td class="' + eff + ' cell_4">' + AstData[name].loyalRoad + '</td>'
				+ '<td class="cell_3 from"><span class="cnt">' + from + '</span></td>'
				+ '<td class="cell_1 cnt">' + arrow + '</td>'
				+ '<td class="cell_3 to">' + AstData[name].to + '</td>'
				+ '</tr></table><div class="underline"></div>';

			$('#notice').remove()
			$('.scrollArea').prepend(html);

			AstData[name].loyalRoad = "단일"
			AstData[name].to = ""
			break


		case "1CE4": case "73": case "76": case "8D2": case "DE5": case "B45": case "1D0C": case "1D60": case "1D1A":
			
			var html = '<table><tr>'
				+ '<td class="cell_1 cnt">' + duration + '</td>'
				+ '<td class="cell_1"><img src="img/' + actionCode + '.png"></td>'
				+ '<td class="cell_2">' + actionName + '</td>'
				+ '<td class="cell_4"></td>'
				+ '<td class="cell_3 from"><span class="cnt">' + from + '</span></td>'
				+ '<td class="cell_1 cnt"></td>'
				+ '<td class="cell_3 to"></td>'
				+ '</tr></table><div class="underline"></div>';
			$('#notice').remove()
			$('.scrollArea').prepend(html);
			spellTimer(actionCode)
			break
	}
}

function spellTimer(actionCode) {
	switch (actionCode) {
		case "76": 
		case "DE5": 
			$('.speBox').find('#' + actionCode + ' .num').text(179)
			break
		case "8D2": 
			$('.speBox').find('#' + actionCode + ' .num').text(59)
			break
		case "B45": 
		case "1D0C": 
		case "1D60": 
		case "1D1A": 
			$('.speBox').find('#' + actionCode + ' .num').text(119)
			break
		case "1CE4": 
			$('.speBox').find('#' + actionCode + ' .num').text(89)
			break
	}
}



function createAst(from) {
	var name = from.replace(/ /g, "").replace(/'/g, "_")
	if (AstData[name] == null) {
		AstData[name] = new Ast()
		
		if (startFlag)
			$('#member').append('<span class="btn_ast" id="' + name + '">' + from + '</span>')
		
		if (from == myName)
			$('#' + name).addClass('on')
	}
	return name
}
function Person() {
	this.job = ""
	this.name = ""
}
function Ast() {
	
	this.cardAction = {
		"E06": 0,
		"1D18": 0,
		"E07": 0,
		"E08": 0,
		"E09": 0,
		"1D13": 0
	}
	
	this.cardCount = {
		"391": 0,
		"392": 0,
		"393": 0,
		"394": 0,
		"395": 0,
		"396": 0,
		"1D14": 0,
		"1D15": 0
	}
	this.use = false
	this.loyalRoad = "단일"
	this.keep = ""
	this.to = ""
}




var myName = null
var myJob = null
var AstData = new Object()
var lastData = null
var lastDataActive = false

var startFlag = false
var autoResetFlag = true
var initFlag = false
