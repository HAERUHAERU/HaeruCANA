
//리셋
//----------------------------------------------------------------------------------------

function reset(flag) {
    switch (flag) {
        case "endEncounter":
            AstData = new Object()
            startFlag = false
            autoResetFlag = true
            break
        case "btn":
                $("#E06,#1D18,#E07,#E08,#E09,#1D13,#391,#392,#393,#394,#395,#396,#1D14,#1D15").find('.num').text(0)
                $('.scrollArea').html('<div id="notice">초기화 완료!<br>초읽기 혹은 전투를 시작하세요!</div>');
                if (lastData != null)
                    $('#target').text('[--:--] 해루카나 (카드분석기)')
                $('#member').html('')
            autoResetFlag = false
            startFlag = true
            break
        case "autoReset":
            $("#E06,#1D18,#E07,#E08,#E09,#1D13,#391,#392,#393,#394,#395,#396,#1D14,#1D15").find('.num').text(0)
            $('#member').html('')
            $('.scrollArea').html('<div id="notice">초읽기 혹은 전투 시작을 인식했습니다.</div>');
            $('#target').text('[--:--] 해루카나 (카드분석기)')
            autoResetFlag = false
            startFlag = true
            break
    }
}

//점성술사 마우스 오버시 처리 
$(document).on('mouseover', '.btn_ast', function () {
    changeList(this.id)
    $('#member').find('span').removeClass('on')
    $('#' + this.id).addClass('on')
});

//계기판 변경
function changeList(id) {
    var actionCode = ["E06", "1D18", "E07", "E08", "E09", "1D13", "391", "392", "393", "394", "395", "396", "1D14", "1D15"]
    for (var j in actionCode) {
        if (j < 6)
            $('#' + actionCode[j]).find('.num').text(AstData[id].cardAction[actionCode[j]])
        else
            $('#' + actionCode[j]).find('.num').text(AstData[id].cardCount[actionCode[j]])
    }
}

//로그 처리 
//----------------------------------------------------------------------------------------
function BeforeLogLineRead(e) {
    var lastLog = JSON.parse(e)    //최신 로그를 객체로 변경

    switch (lastLog.msgtype) {
        case "SendCharName":
            myName = lastLog.msg.charName
            break
        case "AddCombatant":
            if (lastLog.msg.job == 33 && lastLog.msg.name == myName)
                myJob = 'AST';
            break
        case "CombatData":
            lastData = lastLog.msg  //최신 전투 정보 저장
            if (lastLog.from != null || lastLog.from == undefined) {
                //타겟 정보 출력
                $('#notice').remove()
                if (!$('#notice').length)
                    $('#target').text('[' + lastData.Encounter.duration + '] ' + lastData.Encounter.title)
                //전투 집계 끝났을 때 
                if (lastData.Encounter.title != "Encounter")
                    reset('endEncounter')
                //집계 중 
                else {
                    if (startFlag == false) {
                        reset('autoReset')
                        startFlag = true
                    }
                }
            }
            break
        case "Chat":
            var startLog1 = /^(전투 시작 \d\d초 전\! \((.*?)\))$/im
            var startLog2 = /^(전투 시작 \d초 전\! \((.*?)\))$/im
            var startLog3 = /^(전투 시작\!)$/im
            var cancelLog = /^((.*?) 님이 초읽기를 취소했습니다.)/im

            //초읽기 처리 구문
            if (lastLog.msg.split("|")[0] == '00') {
                if (lastLog.msg.split("|")[4].match(startLog1) || lastLog.msg.split("|")[4].match(startLog2)) {
                    if (autoResetFlag == true)
                        reset('autoReset')
                }
                else if ( lastLog.msg.split("|")[4].match(cancelLog) )
                    reset('btn')
                else if ( lastLog.msg.split("|")[4].match(startLog3) )
                    $('.scrollArea').html('<div id="notice">전투를 시작하세요!</div>')                
            }

            //사전 왕도 처리
            if (lastLog.msg.split("|")[0] == '26' || lastLog.msg.split("|")[0] == '30') {
                var from = lastLog.msg.split("|")[6]
                var actionName = lastLog.msg.split("|")[3]
                if (actionName == "왕도: 효과 향상" || actionName == "왕도: 범위화" || actionName == "왕도: 지속시간 증가")
                    getLog(from, '', getActionCode(actionName), actionName)
            }

            //로그 수집 시작
            if (startFlag) {
                //21 : 시전 대상 체크  
                if (lastLog.msg.split("|")[0] == '21') {
                    var from = lastLog.msg.split("|")[3]
                    var to = lastLog.msg.split("|")[7]
                    var actionName = lastLog.msg.split("|")[5]
                    var actionCode = lastLog.msg.split("|")[9]
                    //시간 지연
                    if (actionCode == '0F')
                        getLog(from, to, actionCode, actionName)
                    //카드 시전 시 대상 저장 (광역 제외)             
                    else if (actionCode == '33D' || actionCode == '33E' || actionCode == '33F' || actionCode == '340' || actionCode == '341' || actionCode == '342') {
                        var name = createAst(from)
                        if (AstData[name].loyalRoad != '광역')
                            AstData[name].to = to
                    }
                }
                //00 : 인게임 전투 로그 
                else if (lastLog.msg.split("|")[0] == '00') {
                    var log3 = /^((.*?)(이|가) (여왕의 날개|왕의 검|위상 변화|소 아르카나|보류|점지|묘수|왕도|아제마의 균형|세계수의 줄기|오쉬온의 화살|할로네의 창|살리아크의 물병|비레고의 탑|천궁의 반목)(을|를) 시전했습니다.)$/im

                    if (lastLog.msg.split("|")[4].match(log3)) {
                        var from = lastLog.msg.split("|")[4].match(log3)[2]
                        if (from.indexOf("") > -1)
                            from = from.split("")[1].split("")[0]
                        var actionName = lastLog.msg.split("|")[4].match(log3)[4]
                        getLog(from, '', getActionCode(actionName), actionName)
                    }
                }
                //26: 효과 받음 
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

//로그 분석 
//----------------------------------------------------------------------------------------
function getLog(from, to, actionCode, actionName) {
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

        //점지: 아제마의 균형(391), 점지: 세계수의 줄기(392), 점지: 오쉬온의 화살(393), 
        //점지: 할로네의 창(394), 점지: 살리아크의 물병(395), 점지: 비레고의 탑(396), 왕의 검(1D14), 여왕의 날개(1D15) 
        case "391": case "392": case "393": case "394": case "395": case "396": case "1D14": case "1D15":
            AstData[name].cardCount[actionCode]++;
            $('#member').find('span').removeClass('on')
            if (myJob == "AST") {
                $('#' + actionCode).find('.num').text(AstData[myName].cardCount[actionCode])
                $('#' + myName).addClass('on')
                changeList(myName)
            } else {
                $('#' + actionCode).find('.num').text(AstData[name].cardCount[actionCode])
                $('#member').find('span').removeClass('on')
                $('#' + name).addClass('on')
                changeList(name)
            }
            break

        //점지(E06),묘수(1D18), 왕도(E07), 보류(E08), 위상 변화(E09), 소 아르카나(1D13)
        case "E06": case "1D18": case "E07": case "E08": case "E09": case "1D13":
            AstData[name].cardAction[actionCode]++;
            $('#member').find('span').removeClass('on')
            if (myJob == "AST") {
                $('#' + actionCode).find('.num').text(AstData[myName].cardAction[actionCode])
                $('#' + myName).addClass('on')
                changeList(myName)
            } else {
                $('#' + actionCode).find('.num').text(AstData[name].cardAction[actionCode])
                $('#member').find('span').removeClass('on')
                $('#' + name).addClass('on')
                changeList(name)
            }
            //묘수인 경우 보류 카드 합산 
            if (actionCode == '1D18') {
                getLog(from, '', AstData[name].keep, '')
                AstData[name].keep = ''
            }
            break

        //아제마의 균형(33D), 세계수의 줄기(33E), 오쉬온의 화살(33F), 할로네의 창(340), 살리아크의 물병(341), 비레고의 탑(342)
        //시간 지연(0F), 천궁의 반목(0A)
        case "33D": case "33E": case "33F": case "340": case "341": case "342":
        case "0F": case "0A":
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

        case "천궁의 반목": return "0A"

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
    }
}

//로그 타임라인 출력
//----------------------------------------------------------------------------------------

function createTimeline(from, to, actionCode, actionName) {
    var name = from.replace(/ /g, "").replace(/'/g, "_")
    var arrow = '→'
    var eff = ''

    if (lastData != null)
        var duration = lastData.Encounter.duration;
    else
        var duration = "--:--"

    switch (actionCode) {
        case "0A": case "0F":
            if (lastData != null)
                var duration = lastData.Encounter.duration;
            else
                var duration = "--:--"

            //천궁의 반목 
            if (actionCode == "0A") {
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
                + '<td class="cell_3 to">' + AstData[name].to + '</td>'
                + '</tr></table><div class="underline"></div>';

            $('.scrollArea').prepend(html);
            break
        case "33D": case "33E": case "33F": case "340": case "341": case "342":
            if (AstData[name].loyalRoad == "강화")
                eff = 'eff2'
            else if (AstData[name].loyalRoad == "지속")
                eff = 'eff3'
            else if (AstData[name].loyalRoad == "광역") {
                arrow = ''
                to = ''
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

            $('.scrollArea').prepend(html);

            AstData[name].loyalRoad = "단일"
            AstData[name].to = ""

            break
    }
}

//점성술사 데이터 처리
//----------------------------------------------------------------------------------------
function createAst(from) {
    var name = from.replace(/ /g, "").replace(/'/g, "_")
    //점성술사 등록 
    if (AstData[name] == null) {
        AstData[name] = new Ast()
        $('#member').append('<span class="btn_ast" id="' + name + '">' + from + '</span>')
    }
    return name
}

function Ast() {
    //점지(E06),묘수 (1D18), 왕도(E07), 보류(E08), 위상변화(E09), 소 아르카나(1D13)
    this.cardAction = {
        "E06": 0,
        "1D18": 0,
        "E07": 0,
        "E08": 0,
        "E09": 0,
        "1D13": 0
    }
    //점지: 아제마(391), 점지: 세계수(392), 점지: 오쉬온(393), 점지: 할로네(394), 점지: 물병(395), 점지: 비레고(396), 왕의 검(1D14), 여왕의 날개(1D15) 
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
    this.loyalRoad = "단일"
    this.keep = ""
    this.to = ""
}

//변수 모음
//----------------------------------------------------------------------------------------

var myName = null
var myJob = null
var AstData = new Object()
var lastData = null

var startFlag = false
var autoResetFlag = false
