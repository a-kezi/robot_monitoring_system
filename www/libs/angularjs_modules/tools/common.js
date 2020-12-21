"use strict";
function getIconSrc(type){
    let iconSrcTable = {
        "addy":{
            "icon":"/static/imgs/icons/addy.png",
            "arrow":"/static/imgs/icons/a.png"
        },
        "sero":{
            "icon":"/static/imgs/icons/sero.png",
            "arrow":"/static/imgs/icons/a.png"
        },
        "cart":{
            "icon":"/static/imgs/icons/cart.png",
            "arrow":"/static/imgs/icons/a.png"
        },
        "default":{
            "icon":"/static/imgs/icons/p.png",
            "arrow":"/static/imgs/icons/a.png"
        }
    }
    let isUsableType = iconSrcTable.hasOwnProperty(type);
    let srcPath;
    if(isUsableType){
        srcPath = iconSrcTable[type]
    }else{
        srcPath = iconSrcTable['default']
    }
    return srcPath  
}

function coordTrans(coord, currentScale, mapOrigin, mapAngle, mapFileSize){
    let transCoord = { "x": 0, "y": 0 };
    let r = Math.sqrt((coord.x * coord.x) + (coord.y * coord.y));
    let th;
    if ((coord.x > 0) && (coord.y > 0)) {//1
      th = Math.atan(coord.y / coord.x) + (mapAngle * (Math.PI / 180));
    } else if ((coord.x < 0) && (coord.y > 0)) {//2
      th = Math.PI + Math.atan(coord.y / coord.x) + (mapAngle * (Math.PI / 180));
    } else if ((coord.x < 0) && (coord.y < 0)) {//3
      th = Math.PI + Math.atan(coord.y / coord.x) + (mapAngle * (Math.PI / 180));
    } else {//4
      th = (2 * Math.PI) + Math.atan(coord.y / coord.x) + (mapAngle * (Math.PI / 180));
    }
    transCoord.x = (currentScale * ((20 * r * Math.cos(th)) + mapOrigin.x));
    transCoord.y = (currentScale * mapFileSize.y) - (currentScale * ((20 * r * Math.sin(th)) + mapOrigin.y));
    return transCoord;
}

function angleTrans(orientation){
    let x = parseFloat(orientation.x);
    let y = parseFloat(orientation.y);
    let z = parseFloat(orientation.z);
    let w = parseFloat(orientation.w);
    let euler = new THREE.Euler();
    euler.setFromQuaternion(new THREE.Quaternion(x,y,z,w));
    let degree_z = (euler.z/Math.PI)*180
    degree_z=-degree_z+90
    return degree_z;
}
function angleTrans_origin(orientation){
    let x = parseFloat(orientation.x);
    let y = parseFloat(orientation.y);
    let z = parseFloat(orientation.z);
    let w = parseFloat(orientation.w);
    let euler = new THREE.Euler();
    euler.setFromQuaternion(new THREE.Quaternion(x,y,z,w));
    let degree_z = (euler.z/Math.PI)*180
    degree_z=-degree_z
    return degree_z;
}

function getShortname(index,array){
    let name = array[index].thingName;
    let temp = name.match(/[0-9]+/g);
    if(name=="로봇없음"){
        return "X";
    }else{
        if(parseInt(temp)<10){
            return name.charAt(0).toUpperCase()+name.substring(name.indexOf("-")+1,name.indexOf("-")+2);
        } else{
            return name.charAt(0).toUpperCase()+name.substring(name.indexOf("-")+1,name.indexOf("-")+3);
        }
    }
}



// 직선 위, 두 점의 중심 좌표
function getCoordinateOfTwoPts(pt1,pt2){
    let A = pt2.x + pt1.x
    let B = pt2.y + pt1.y
    return {x:A/2,y:B/2}
}

// 사각형의 중심 좌표
function getCenterCoordOfRectangle(ele){
    let pts = getElementVertex(ele);
    let center = getCoordinateOfTwoPts(pts.pt1, pts.pt3);
    return center
}



// 이벤트 발생 위치가 4개의 꼭지점 으로 이루는 직사각형안에 들어가는지 확인 (제한적이라 업데이트 필요할 수 있음)
function checkCross(vertex, ev){
    function lineIntersect(x1,y1,x2,y2, x3,y3,x4,y4) {
        var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
        var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
        if (isNaN(x)||isNaN(y)) {
            return false;
        } else {
            if (x1>=x2) {
                if (!(x2<=x&&x<=x1)) {return false;}
            } else {
                if (!(x1<=x&&x<=x2)) {return false;}
            }
            if (y1>=y2) {
                if (!(y2<=y&&y<=y1)) {return false;}
            } else {
                if (!(y1<=y&&y<=y2)) {return false;}
            }
            if (x3>=x4) {
                if (!(x4<=x&&x<=x3)) {return false;}
            } else {
                if (!(x3<=x&&x<=x4)) {return false;}
            }
            if (y3>=y4) {
                if (!(y4<=y&&y<=y3)) {return false;}
            } else {
                if (!(y3<=y&&y<=y4)) {return false;}
            }
        }
        return true;
    }

    let x1 = vertex.pt1.x,
    x2 = vertex.pt2.x,
    x3 = ev.clientX,
    x4 = 77777;

    let y1 = vertex.pt1.y,
    y2 = vertex.pt2.y,
    y3 = ev.clientY,
    y4 = ev.clientY;

    let a1 = vertex.pt3.x,
    a2 = vertex.pt4.x,
    a3 = ev.clientX,
    a4 = 77777;

    let b1 = vertex.pt3.y,
    b2 = vertex.pt4.y,
    b3 = ev.clientY,
    b4 = ev.clientY;

    let result =0 ;
    

    if(lineIntersect(x1,y1,x2,y2,x3,y3,x4,y4)){
        result += 1
    }
    if(lineIntersect(a1,b1,a2,b2,a3,b3,a4,b4)){
        result += 1
    }

    return result==1 ? true : false
}

// 지정 doc의 4개 꼭지점 좌표 구하기
function getElementVertex(el) {
    let rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop,
    pt1 = { y: rect.top + scrollTop, x: rect.left + scrollLeft },
    pt2 = { y: rect.top + scrollTop + el.clientHeight, x: rect.left + scrollLeft},
    pt3 = { y: rect.top + scrollTop + el.clientHeight, x: rect.left + scrollLeft + el.clientWidth  },
    pt4 = { y: rect.top + scrollTop, x: rect.left + scrollLeft + el.clientWidth }

    return { pt1:pt1, pt2:pt2, pt3:pt3, pt4:pt4 }
}

// 앵귤러 컨트롤러에서 받은 $element를 이용하여 타겟 doc 구하기
function getTargetEle(curtElement, className, type){
    let list = curtElement.find(type)
    let target = null;
    for(let i=0;i<list.length;i++){
        if(list[i].className == className){
            target = list[i]
        }
    }
    return target
}

// 두 점 사이의 거리
function getDistanceOfTwoPts(pt1,pt2){
    let A = pt2.x - pt1.x
    let B = pt2.y - pt1.y
    let C = Math.pow(A,2) + Math.pow(B,2)
    return Math.sqrt(C)
}

// 반지름 구하기
function getRadius(width, height){
    let A = width/2;
    let B = height/2;
    let C = Math.pow(A,2) + Math.pow(B,2)
    return Math.sqrt(C)
}

// 특정 doc의 반지름에 extraLength를 추가하여 그린 원 범위안에 타겟 doc 반지름으로 그린 원이 접촉되는지 확인
function checkIsTargetInCircle(targetRadius, targetLocation, mapViewGeo, extraLength){
    
    let targetR = targetRadius;
    let circleR = getRadius(mapViewGeo.width,mapViewGeo.height);
    let lengthForComparison = targetR + extraLength + circleR

    let ctr_target = targetLocation
    let ctr_circle = mapViewGeo.center

    let lengthOfTwoTargetCenter = getDistanceOfTwoPts(ctr_target,ctr_circle);
    
    return lengthOfTwoTargetCenter>lengthForComparison ? false : true
}



function robotListDataForm(element, default_size){
    return {
        name:element.name,
        robotid : element.id,
        type : element.type,
        
        iconSrc : getIconSrc(element.type),
        iconStyle : {
            pose:{
                'z-index':4,
                'transform': `translate(-40000px,-40000px)`
            },
            orientation:{
                'transform': 'translate(-50%,-50%) rotateZ(0deg)'
            },
            robot:{
                'height':`${default_size}px`
            }
        },
        zIndex:4,
        pose: {
            "orientation": {
            "w": 1,
            "x": 0,
            "y": 0,
            "z": 0
            },
            "position": {
            "x": -1000,
            "y": -1000,
            "z": 0
            }
        },
        finalstate:10
    }
}

