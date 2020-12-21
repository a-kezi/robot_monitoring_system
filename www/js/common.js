function getCookie(cname){
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(unescape(document.cookie));
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setCookieHour( name, value, hours ){   
    var now = new Date();
	var time = now.getTime();
	time += 3600 * 1000 * hours;
	now.setTime(time);
	document.cookie = name + "=" + escape( value ) + "; path=/; expires=" + now.toUTCString() + ";"   
}

function componentLoadingMask(targetID, imgname) {
    var maskHeight = $(`#${targetID}`).height();
    var maskWidth  = $(`#${targetID}`).width(); 

    var imgSize = Math.min(maskHeight, maskWidth)/3;
    if(Math.min(maskHeight, maskWidth)==maskHeight){
        var verticalMargin = maskHeight/3;
        var HorizontalMargin = (maskWidth - imgSize)/2;
    }else if(Math.min(maskHeight, maskWidth)==maskWidth){
        var verticalMargin = (maskHeight - imgSize)/2;
        var HorizontalMargin = maskWidth/3;
    }


    //화면에 출력할 마스크를 설정해줍니다.
    var mask =`
    <div id="${targetID}Mask" class='loading-mask' style='position:absolute; z-index:100; background-color:rgba(0,0,0,0.3); display:none; left:0; top:0;'>
        <div id='loadingImg'>
            <img src='/static/imgs/icons/${imgname}' style='position: relative; display: block; margin:${verticalMargin}px ${HorizontalMargin}px; width:${imgSize}px;'/>
        </div>
    </div>`

    //화면에 레이어 추가
    $(`#${targetID}`)
        .append(mask)
        
    //마스크의 높이와 너비를 화면 것으로 만들어 전체 화면을 채웁니다.
    $(`#${targetID}Mask`).css({
        'width' : maskWidth, 
        'height': maskHeight
    });

    //마스크 표시
    $(`#${targetID}Mask`).show();  

}

function closeComponentLoadingMask(targetID) {
    $(`#${targetID}`).find('.loading-mask').hide();
    $(`#${targetID}`).find('.loading-mask').remove();
}

function pageLoadingMask(imgname) {
    //화면의 높이와 너비를 구합니다.
    var navHeight = $('nav').height();
    var maskHeight = $( window ).height()-navHeight;
    var maskWidth  = $( window ).width();

    var imgSize = Math.min(maskHeight, maskWidth)/5;
    // console.log(maskHeight, maskWidth, imgSize)
    if(Math.min(maskHeight, maskWidth)==maskHeight){
        var verticalMargin = maskHeight/2.5;
        var HorizontalMargin = (maskWidth - imgSize)/2;
    }else if(Math.min(maskHeight, maskWidth)==maskWidth){
        var verticalMargin = (maskHeight - imgSize)/2;
        var HorizontalMargin = maskWidth/2.5;
    }

    //화면에 출력할 마스크를 설정해줍니다.
    var mask       =`
    <div class='loading-mask' style='position:absolute; z-index:100; background-color:rgba(0,0,0,0.3); display:none; left:0; top:0;margin-top:${navHeight}px'>
        <div id='loadingImg'>
            <img src='/static/imgs/icons/${imgname}' style='position: relative; display: block; margin:${verticalMargin}px ${HorizontalMargin}px;width:${imgSize}px;'/>
        </div>
    </div>`

    //화면에 레이어 추가
    $(`#content`).append(mask)

    //마스크의 높이와 너비를 화면 것으로 만들어 전체 화면을 채웁니다.
    // $('.loading-mask').css({
    //     'width' : maskWidth,
    //     'height': maskHeight
    // });
    $('.loading-mask').css({
        'width' : maskWidth,
        'height': maskHeight
    });

    //마스크 표시
    $('.loading-mask').show();  
}

function closePageLoadingMask() {
    $(`#content`).find('.loading-mask').hide();
    $(`#content`).find('.loading-mask').remove();
}

function getFormatDate(timestamp){
    var date = new Date(timestamp);
    var month = (1 + date.getMonth());
    month = month >= 10 ? month : '0' + month;
    var day = date.getDate();
    day = day >= 10 ? day : '0' + day;
    return  month + '.' + day;
}
function getFormatTime(timestamp){
    var date = new Date(timestamp);
    var hour = date.getHours();
    hour = hour < 10 ? "0" + hour : hour;
    var min = date.getMinutes();
    min = min < 10 ? "0" + min : min;
    var sec = date.getSeconds();
    sec = sec < 10 ? "0" + sec : sec;
    
    return  hour + ':' + min+':'+sec; 
}