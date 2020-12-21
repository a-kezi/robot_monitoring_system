'use strict'
dashboardApp.controller('backofficeCtrl', function ($scope, $restApiReq) {
    $scope.tree = undefined
    $scope.selectedDepartment = undefined
    $scope.selectedDoctor = undefined
    $scope.unselectedDep = "수정할 항목을 선택해주세요"
    // $('#editor-item-submit').click(function() {document.forms[0].submit()});
    

    $scope.rest_ip = $("#serverIp").val()
    $scope.rest_port = $("#serverPort").val()
    $scope.rest_url = `http://${$scope.rest_ip}:${$scope.rest_port}/backoffice/api`
    $scope.rest_img = `${$scope.rest_url}/img`

    const fileTypes = [
        "image/apng",
        "image/bmp",
        "image/gif",
        "image/jpeg",
        "image/pjpeg",
        "image/png",
        "image/svg+xml",
        "image/tiff",
        "image/webp",
        "image/x-icon"
    ];
    
    function validFileType(file) {
        return fileTypes.includes(file.type);
    }
    function returnFileSize(number) {
        if(number < 1024) {
            return number + 'bytes';
        } else if(number >= 1024 && number < 1048576) {
            return (number/1024).toFixed(1) + 'KB';
        } else if(number >= 1048576) {
            return (number/1048576).toFixed(1) + 'MB';
        }
    }
    function updateImageDisplay() {
        while($scope.preview.firstChild) {
            $scope.preview.removeChild($scope.preview.firstChild);
        }
        const curFiles = $scope.image_input.files;
        if(curFiles.length === 0) {
            const div = document.createElement('div');
            div.textContent = 'No files currently selected for upload';
            $scope.preview.appendChild(div);
        } else {
            for(const file of curFiles) {
                const div = document.createElement('div');
                if(validFileType(file)) {
                    div.textContent = `file size ${returnFileSize(file.size)}.`;
                    const image = document.createElement('img');
                    image.src = URL.createObjectURL(file);
                    $scope.selectedImg = URL.createObjectURL(file)
            
                    $scope.preview.appendChild(image);
                    $scope.preview.appendChild(div);
                } else {
                    div.textContent = `Not a valid file type. Update your selection.`;
                    $scope.preview.appendChild(div);
                }
        
            }
        }
    }

    /*
        addEventListener
    */
    window.addEventListener("siteChanged", function(e) {
        closePageLoadingMask();
        $scope.$root.isZoneReady = false;
        $scope.$root.isRobotReady = false;
        $scope.$root.isSubListReady = false;
        
    });
    $(window).resize(function () {
        console.log("----")
        $(".tree-case").height($(window).height()-250);
    });
    $(document).ready(function(){
        console.log("----")
        $(".tree-case").height($(window).height()-250);
    });
    /*
        addEventListener
    */
    $scope.onUp = function(){
        console.log("onUp")
        if($scope.selectedDepartment!=undefined){
            // department
            if($scope.tree.isOkToUp()){
                $.post($scope.rest_url+'/update/department/order',
                {
                    direction: "up",
                    crt_order: $scope.tree.getSelectedNode.ord,
                    data_id: $scope.tree.getSelectedNode.data_id
                },
                function(data, status){
                    console.log(data)
                    $scope.tree.departmentUp()
                });
            }
        }
        if($scope.selectedDoctor!=undefined){
            // doctor
            if($scope.tree.isOkToUp()){
                $.post($scope.rest_url+'/update/doctor/order',
                {
                    direction: "up",
                    department_id: $scope.tree.getSelectedNode.department_id,
                    crt_order: $scope.tree.getSelectedNode.ord,
                    data_id: $scope.tree.getSelectedNode.data_id
                },
                function(data, status){
                    console.log(data)
                    $scope.tree.doctorUp()
                });
            }
        }
        
    }
    $scope.onDown = function(){
        console.log("onDown")
        if($scope.selectedDepartment!=undefined){
            // department
            if($scope.tree.isOkToDown()){
                $.post($scope.rest_url+'/update/department/order',
                {
                    direction: "down",
                    crt_order: $scope.tree.getSelectedNode.ord,
                    data_id: $scope.tree.getSelectedNode.data_id
                },
                function(data, status){
                    console.log(data)
                    $scope.tree.departmentDown()
                });
            }
        }
        if($scope.selectedDoctor!=undefined){
            // doctor
            if($scope.tree.isOkToDown()){
                $.post($scope.rest_url+'/update/doctor/order',
                {
                    direction: "down",
                    department_id: $scope.tree.getSelectedNode.department_id,
                    crt_order: $scope.tree.getSelectedNode.ord,
                    data_id: $scope.tree.getSelectedNode.data_id
                },
                function(data, status){
                    console.log(data)
                    $scope.tree.doctorDown()
                });
            }
        }
        
    }
    $scope.onAddDepartment = function(){
        console.log("onAddDepartment")
        let create_data = {}
        let departments = $scope.tree.getDepartments
        let new_ord = departments.length + 1
        create_data['data_id'] = $scope.tree.getUUID()
        create_data['ord'] = Number(new_ord)
        create_data['default_opt'] = 0
        create_data['type'] = ""
        create_data['img_flag'] = 0
        create_data['check_flag'] = 1
        create_data['title_korean'] = "새 부서"
        create_data['description'] = ""
        create_data['location'] = ""
        create_data['img'] = ""
        create_data['position_x'] = 70
        create_data['position_y'] = 89
        create_data['doctors'] = []

        $.post($scope.rest_url+'/create/department',
        create_data,
        function(data, status){
            if(data.state==true){
                $scope.tree.addDepartmentNode(create_data)
            }
        });
    }







    $scope.onAddDoctor = function(){
        console.log("onAddDoctor")
        if($scope.selectedDepartment == undefined){
            alert("의사를 추가할 부서를 선택해 주세요.")
            return false
        }
        let create_data = {}
        let doctors = $scope.selectedDepartment.nodes
        let new_ord = doctors.length + 1

        create_data['department_id'] = $scope.selectedDepartment.data_id
        create_data['data_id'] = $scope.tree.getUUID()
        create_data['ord'] = Number(new_ord)
        create_data['img_flag'] = 0
        create_data['check_flag'] = 1
        create_data['picture'] = ""
        create_data['name'] = "새 의사"
        create_data['title'] = ""
        create_data['major'] = ""
        create_data['education'] = ['']
        create_data['career'] = ['']
        create_data['academy'] = ['']

        $.post($scope.rest_url+'/create/doctor',
        create_data,
        function(data, status){
            if(data.state==true){
                $scope.tree.addDoctorNode(create_data)
                $scope.selectedDepartment = undefined
            }
        });
    }
    $scope.onDeleteNode = function(){
        console.log("onDeleteNode")
        if(
            $scope.selectedDepartment==undefined &&
            $scope.selectedDoctor==undefined
            ){
            alert("삭제할 항목을 선택하세요") 
            return false
        }
        if($scope.selectedDepartment!=undefined){
            // department가 선택됨
            if(!$('#default_opt_check')[0].checked){
                // department delete 
                console.log("departement delete call")
                $.post($scope.rest_url+'/delete/department',
                {
                    data_id: $scope.selectedDepartment.data_id,
                },
                function(data, status){
                    if(data.state==true){
                        $scope.selectedDepartment = undefined
                        $scope.getAllData(function(result){
                            if(result.state == true){
                                $scope.tree.AllDataUpdate(result.desc)
                            }
                        })
                    }
                });
                
            }else{
                alert("편집 보호 설정이 되어있습니다.")
            }
        }else if($scope.selectedDoctor!=undefined){
            // doctor가 선택됨
            // doctor가 delete 
            console.log("doctor가 delete call")
            $.post($scope.rest_url+'/delete/doctor',
            {
                data_id: $scope.selectedDoctor.data_id,
                department_id: $scope.selectedDoctor.department_id,
            },
            function(data, status){
                if(data.state==true){
                    $scope.selectedDoctor = undefined
                    $scope.getAllData(function(result){
                        if(result.state == true){
                            $scope.tree.AllDataUpdate(result.desc)
                        }
                    })
                }
            });
        }
    }
    $scope.onDeploy = function(){
        console.log("onDeploy")
        // $scope.tree.deploy()
    }
    $scope.onSaveDepartment = function(){
        console.log("onSaveDepartment")
        if(!$('#default_opt_check')[0].checked){
            // document.forms[0].submit()
            $.ajax({
                url: $('#editor-form').attr("action"),
                type: $('#editor-form').attr("method"),
                dataType: "JSON",
                data: new FormData($('#editor-form')[0]),
                processData: false,
                contentType: false,
                success: function (data, status)
                {
                    if(data.state==true){
                        // node 정보 업데이트
                        $scope.tree.updateDepartmentData(data.desc, $scope.selectedDepartment.data_id)
                        console.log($scope.selectedDepartment)
                        // preview 업데이트
                        $scope.$apply(function(){
                            if(data.desc.img_name!=undefined){
                                $scope.selectedDepartment.img_flag = 1
                                $scope.selectedDepartment.img = data.desc.img_name
                                $("#crt-dep-photo-img").attr("src", $scope.selectedImg);
                            }
                        })
                        
                    }
        
                },
                error: function (xhr, desc, err)
                {
                    console.log(err)
                }
            });  
        }else{
            alert("편집 보호 설정이 되어있습니다.")
        }
    }
    $scope.onSaveDoctor = function(){
        console.log("onSaveDoctor")
        $.ajax({
            url: $('#editor-form').attr("action"),
            type: $('#editor-form').attr("method"),
            dataType: "JSON",
            data: new FormData($('#editor-form')[0]),
            processData: false,
            contentType: false,
            success: function (data, status)
            {
                if(data.state==true){
                    
                    // node 정보 업데이트
                    $scope.getAllData(function(result){
                        if(result.state == true){
                            $scope.tree.AllDataUpdate(result.desc)
                        }
                    })
                    // preview 업데이트
                    $scope.$apply(function(){
                        if(data.desc.img_name!=undefined){
                            $scope.selectedDoctor.img_flag = 1
                            $scope.selectedDoctor.picture = data.desc.img_name
                            $("#crt-doc-photo-img").attr("src", $scope.selectedImg);
                        }
                    })
                    
                }
    
            },
            error: function (xhr, desc, err)
            {
                console.log(err)
            }
        });
    }


    
    $scope.getAllData = function(cb){
        $.post($scope.rest_url + '/get/all', {},
            function(data, status){
                console.log(data)
                cb(data)
            });
    }
    $scope.imgEvSet = function(){
        if(!$scope.isImgInputReady){
            $scope.isImgInputReady = true
            $scope.image_input = document.querySelector('#image_uploads');
            $scope.preview = document.querySelector('.preview');
            $scope.image_input.addEventListener('change', updateImageDisplay);
        }
    }
    $scope.addInput = function(event, type){
        let len = $scope.selectedDoctor[type].length+1
        $scope.selectedDoctor[type].push({
            ord : len,
            value: ""
        })
    }
    $scope.deleteInput = function(event, type){
        let len = $scope.selectedDoctor[type].length
        if(len!=1){
            $scope.selectedDoctor[type].pop();
        }
    }
    $scope.onClickDefaultCheck = function(ev){
        if(ev.currentTarget.checked){
            // 보호 해제
            if(confirm("편집 보호 설정을 하시겠습니까?")){
                //yes 변경
                $.post($scope.rest_url + '/department/default', {
                    set:1,
                    data_id: $scope.selectedDepartment.data_id
                },
                function(data, status){
                    console.log(data)
                    $scope.tree.updateDepartmentData({
                        default_opt: 1
                    }, $scope.selectedDepartment.data_id)
                });

            }else{
                //no
                ev.currentTarget.checked = false
            }

        }else{
            // 보호 해제
            if(confirm("편집 보호 설정을 해제하시겠습니까?")){
                //yes 변경
                $.post($scope.rest_url + '/department/default', {
                    set:0,
                    data_id: $scope.selectedDepartment.data_id
                },
                function(data, status){
                    console.log(data)
                    $scope.tree.updateDepartmentData({
                        default_opt: 0
                    }, $scope.selectedDepartment.data_id)
                });

            }else{
                //no
                ev.currentTarget.checked = true

            }
        }
        
    }
    this.$onInit = async function() {
        $('#editor-content').css("display","initial");
        $scope.getAllData(function(result){
            if(result.state == true){
                $scope.origin_data = result.desc
                $scope.tree = new TreeViewController($scope.origin_data)
                // $scope.tree = new TreeViewController(testdata)
                $scope.tree.setEvCallback("nodeSelected", function(data){
                    if(data.parentId==0){
                        $scope.$apply(function(){
                            $scope.selectedDepartment = data
                            $scope.selectedDoctor = undefined
                            console.log($scope.selectedDepartment)
                        })
                    }else{
                        $scope.$apply(function(){
                            $scope.selectedDoctor = data
                            $scope.selectedDepartment = undefined
                            // $scope.selectedDepartment = $scope.tree.getSelectedParent
                            console.log("## doctor")
                            console.log($scope.selectedDoctor)
                        })
                    }
                }) 
                $scope.tree.setEvCallback("nodeUnselected", function(data){
                    $scope.$apply(function(){
                        $scope.selectedDepartment = undefined
                        $scope.selectedDoctor = undefined
                        $scope.isImgInputReady = false
                    })
                    
                }) 
                
                $scope.tree.setEvCallback("nodeChecked", function(data){
                    if(data.parentId==0){
                        $scope.$apply(function(){
                            $scope.selectedDepartment = data
                            console.log(data)
                            // $scope.selectedDepartment = $('#tree').treeview('getSelected', $scope.selectedDepartment.nodeId);
                            console.log($scope.selectedDepartment)
                        })
                    }else{
                        $scope.$apply(function(){
                            $scope.selectedDoctor = data
                            // $scope.selectedDepartment = $scope.tree.getSelectedParent
                            console.log(data)
                            $scope.selectedDoctor = $('#tree').treeview('getSelected', $scope.selectedDoctor.nodeId);
                            console.log($scope.selectedDoctor)
                        })
                    }
                }) 
                $scope.tree.setEvCallback("nodeUnchecked", function(data){
                    if(data.parentId==0){
                        $scope.$apply(function(){
                            $scope.selectedDepartment = data
                            
                            // $scope.selectedDepartment = $('#tree').treeview('getSelected', $scope.selectedDepartment.nodeId);
                            console.log($scope.selectedDepartment)
                        })
                    }else{
                        $scope.$apply(function(){
                            $scope.selectedDoctor = data
                            // $scope.selectedDepartment = $scope.tree.getSelectedParent
                            
                            $scope.selectedDoctor = $('#tree').treeview('getSelected', $scope.selectedDoctor.nodeId);
                            console.log($scope.selectedDoctor)
                        })
                    }
                }) 
                
            }
            
        })
    };
    
});

