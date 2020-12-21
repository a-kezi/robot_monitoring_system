'use strict';
/** 
Bootstrap Tree View Controller Class
@author Zihun Kye(2020.11.05) <zihun.kye@wonik.com>
@requires jQuery v2.1.1(>=1.9.0)
@requires Bootstrap v3.3.4(>=3.0.0)
@requires bootstrap-treeview v1.2.0
@example
@namespace
**/
class TreeViewController {
    constructor(data) {
        this.originData = data
        this.callbacks = {
            list:[]
        }
        this.selectedNode = undefined
        this.selectedParent = undefined

        this._tree = $('#tree')
        this.initTree(this.originData)

    }
    // Getter
    get getOriginData(){
        return this.originData
    }
    get getDepartments(){
        return this.originData.department
    }
    get getSelectedNode(){
        return this.selectedNode
    }
    get getSelectedParent(){
        return this.selectedParent
    }
    // Method
    /**
        @method TreeViewController.AllDataUpdate
        @description
        update tree view data
        @param {object} data departments, doctors data
    **/
    AllDataUpdate(data){
        this.originData = data
        this.makeTree(this.originData)
    }
    updateDepartmentData(data, id) {
        let nodeIndex = this.getNodeIndex(this.selectedNode.nodeId)
        if(this.originData.department[nodeIndex].data_id == id){
            if(data.title_korean!=undefined){
                this.originData.department[nodeIndex].title_korean = data.title_korean
                this.originData.department[nodeIndex].text = data.title_korean
            }
            if(data.type!=undefined){
                this.originData.department[nodeIndex].type = data.type
            }  
            if(data.location!=undefined){
                this.originData.department[nodeIndex].location = data.location
            }  
            if(data.description!=undefined){
                this.originData.department[nodeIndex].description = data.description
            }  
            if(data.img_name!=undefined){
                this.originData.department[nodeIndex].img_name = data.img_name
            }
            if(data.img_name!=undefined){
                this.originData.department[nodeIndex].img_name = data.img_name
                this.originData.department[nodeIndex].img_flag = 1
            }  
            if(data.default_opt!=undefined){
                this.originData.department[nodeIndex].default_opt = data.default_opt
            }  
            this.makeTree(this.originData)
        }
    }
    
    updateDoctorData
    /**
        @method TreeViewController.setEvCallback
        @description
        set event callback
        @param {string} eventType event type
        @param {object} cb callback fucntion object
    **/
    setEvCallback(eventType, cb){
        if(this.callbacks.list.includes(eventType)) return false
        this.callbacks.list.push(eventType)
        this.callbacks[eventType] = cb
    }
    
    /**
        @method TreeViewController.refresh
        @description
        refresh treeview
    **/
    refresh(){
        $('#tree').treeview(true).search()
    }
    /**
        @method TreeViewController.departmentUp
        @description
        department order change
    **/
    departmentUp(){
        // console.log(this.originData)
        // let nodeIndex = this.getNodeIndex(this.selectedNode.nodeId)
        let nodeIndex = this.getNodeIndexByOrd(this.selectedNode.ord)
        let temp_origin = this.originData.department[nodeIndex-1]
        temp_origin.ord += 1
        this.originData.department[nodeIndex-1] = this.originData.department[nodeIndex]
        this.originData.department[nodeIndex-1].ord -= 1
        this.originData.department[nodeIndex] = temp_origin
        // this.makeTree(this.originData)

        let temp = this.selectedParent.nodes[nodeIndex-1]
        temp.ord += 1
        this.selectedParent.nodes[nodeIndex-1] =  this.selectedParent.nodes[nodeIndex]
        this.selectedParent.nodes[nodeIndex-1].ord -= 1
        this.selectedParent.nodes[nodeIndex] = temp
        this.selectedNode = this.selectedParent.nodes[nodeIndex-1]
        this.refresh()
    }
    doctorUp(){
        let departmentIndex = this.getParentIndex(this.selectedParent.data_id)
        let doctorIndex = this.getNodeIndex(this.selectedNode.nodeId)
        let department_org = this.originData.department[departmentIndex]
        let temp_origin = department_org.doctors[doctorIndex-1]
        temp_origin.ord += 1
        department_org.doctors[doctorIndex-1] = department_org.doctors[doctorIndex]
        department_org.doctors[doctorIndex-1].ord -= 1
        department_org.doctors[doctorIndex] = temp_origin
        // this.makeTree(this.originData)

        let temp = this.selectedParent.nodes[doctorIndex-1]
        temp.ord += 1
        this.selectedParent.nodes[doctorIndex-1] =  this.selectedParent.nodes[doctorIndex]
        this.selectedParent.nodes[doctorIndex-1].ord -= 1
        this.selectedParent.nodes[doctorIndex] = temp
        this.selectedNode = this.selectedParent.nodes[doctorIndex-1]
        
        this.refresh()
    }
    isOkToUp(){
        if(this.selectedNode == undefined){
            alert("이동할 항목을 선택해 주세요.")
            return false
        }
        let nodeIndex = this.getNodeIndex(this.selectedNode.nodeId)
        if(nodeIndex<=0) return false
        return true
    }
    /**
        @method TreeViewController.departmentDown
        @description
        department order change
    **/
    departmentDown(){
        // console.log(this.originData)
        // let nodeIndex = this.getNodeIndex(this.selectedNode.nodeId)
        let nodeIndex = this.getNodeIndexByOrd(this.selectedNode.ord)
        let temp_origin = this.originData.department[nodeIndex+1]
        temp_origin.ord -= 1
        this.originData.department[nodeIndex+1] = this.originData.department[nodeIndex]
        this.originData.department[nodeIndex+1].ord += 1
        this.originData.department[nodeIndex] = temp_origin
        // this.makeTree(this.originData)
        
        let temp = this.selectedParent.nodes[nodeIndex+1]
        temp.ord -= 1
        this.selectedParent.nodes[nodeIndex+1] =  this.selectedParent.nodes[nodeIndex]
        this.selectedParent.nodes[nodeIndex+1].ord += 1
        this.selectedParent.nodes[nodeIndex] = temp
        this.selectedNode = this.selectedParent.nodes[nodeIndex+1]
        this.refresh()
    }
    doctorDown(){
        let departmentIndex = this.getParentIndex(this.selectedParent.data_id)
        let doctorIndex = this.getNodeIndex(this.selectedNode.nodeId)
        let department_org = this.originData.department[departmentIndex]
        let temp_origin = department_org.doctors[doctorIndex+1]
        temp_origin.ord -= 1
        department_org.doctors[doctorIndex+1] = department_org.doctors[doctorIndex]
        department_org.doctors[doctorIndex+1].ord += 1
        department_org.doctors[doctorIndex] = temp_origin
        // this.makeTree(this.originData)

        let temp = this.selectedParent.nodes[doctorIndex+1]
        temp.ord -= 1
        this.selectedParent.nodes[doctorIndex+1] =  this.selectedParent.nodes[doctorIndex]
        this.selectedParent.nodes[doctorIndex+1].ord += 1
        this.selectedParent.nodes[doctorIndex] = temp
        this.selectedNode = this.selectedParent.nodes[doctorIndex+1]
        this.refresh()
    }
    isOkToDown(){
        if(this.selectedNode == undefined){
            alert("이동할 항목을 선택해 주세요.")
            return false
        }
        let nodeIndex = this.getNodeIndex(this.selectedNode.nodeId)
        if(nodeIndex>=this.selectedParent.nodes.length-1) return false
        return true
    }
    /**
        @method TreeViewController.addDepartmentNode
        @description
        add department node
    **/
    addDepartmentNode(dump){
        console.log(dump)
        this.originData.department.push(dump)
        this.makeTree(this.originData)
    }
    /**
        @method TreeViewController.addDoctorNode
        @description
        add department node
    **/
    addDoctorNode(data){
        if(this.selectedNode == undefined){
            alert("의사를 추가할 부서를 선택해 주세요.")
            return false
        }
        // console.log(this.originData.department)
        console.log(data)
        let nodeIndex = this.getNodeIndex(this.selectedNode.nodeId)
        console.log(this.originData.department[nodeIndex])
        this.originData.department[nodeIndex].doctors.push(data)
        this.makeTree(this.originData)
    }
    /**
        @method TreeViewController.deleteDepartmentNode
        @description
        delete selected department node
    **/
    deleteDepartmentNode(){
        if(this.selectedNode == undefined){
            alert("삭제할 부서를 선택해 주세요.")
            return false
        }
        console.log(this.selectedNode)
        if(this.selectedNode.default){
            alert("해당 부서는 지울 수 없습니다.")
            return false
        }
        if(confirm(`${this.selectedNode.text}를 삭제하시겠습니까?`)){
            let nodeIndex = this.getNodeIndex(this.selectedNode.nodeId)
            this.originData.department.splice(nodeIndex, 1)
            this.makeTree(this.originData)
        }
    }
    /**
        @method TreeViewController.makeTree
        @description
        make tree
        @param {object} data departments, doctors data
    **/
    makeTree(data){
        let expandState = $('#tree').treeview('getExpanded', 0)
        let self = this
        // make tree
        $('#tree').treeview(
            {
                data: this.makeDataForm(data),
                levels: 3,
                showCheckbox:true,
            }
        )
        // event set
        $('#tree').on('nodeChecked', function(event, data) {
            self.selectedNode = data
            self.selectedParent = $('#tree').treeview(
                'getParent', data.nodeId);
            self.angularCallback("nodeChecked",data)
        });
        $('#tree').on('nodeUnchecked', function(event, data) {
            self.selectedNode = data
            self.selectedParent = $('#tree').treeview(
                'getParent', data.nodeId);
            self.angularCallback("nodeUnchecked",data)
        });
        $('#tree').on('nodeSelected', function (event, data) {
            self.selectedNode = data
            self.selectedParent = $('#tree').treeview(
                'getParent', data.nodeId);
            self.angularCallback("nodeSelected",data)
        });
        $('#tree').on('nodeUnselected', function (event, data) {
            self.selectedNode = undefined
            self.selectedParent = undefined
            self.angularCallback("nodeUnselected",data)
        });
        expandState.forEach(node=>{
            let check_node = $('#tree').treeview('getNode', node.nodeId);
            if(check_node.data_id == node.data_id){
                if(node.nodeId!=0 || node.nodeId==undefined){
                    $('#tree').treeview('expandNode', [node.nodeId,{}]);
                }
            }
            
        })
    }
    initTree(data){
        console.log(data)
        let self = this
        // make tree
        $('#tree').treeview(
            {
                data: this.makeDataForm(data),
                levels: 3,
                showCheckbox:true,
            }
        )
        // event set
        $('#tree').on('nodeChecked', function(event, data) {
            self.selectedNode = data
            self.selectedParent = $('#tree').treeview(
                'getParent', data.nodeId);
            // let index = getNodeIndex(data.nodeId)
            self.angularCallback("nodeChecked",data)
        });
        $('#tree').on('nodeUnchecked', function(event, data) {
            self.selectedNode = data
            self.selectedParent = $('#tree').treeview(
                'getParent', data.nodeId);
            self.angularCallback("nodeUnchecked",data)
        });
        $('#tree').on('nodeSelected', function (event, data) {
            self.selectedNode = data
            self.selectedParent = $('#tree').treeview(
                'getParent', data.nodeId);
            self.angularCallback("nodeSelected",data)
        });
        $('#tree').on('nodeUnselected', function (event, data) {
            self.selectedNode = undefined
            self.selectedParent = undefined
            self.angularCallback("nodeUnselected",data)
        });
    }

    
    /**
        @method TreeViewController.getNodeIndex
        @description
        get nodes array index by nodeId
        @param {string} nodeId
    **/
    getNodeIndex(nodeId){
        let index = undefined
        let num = 0
        this.selectedParent.nodes.some(element =>{
            if(element.nodeId==nodeId) index = num
            num += 1
            return element.nodeId==nodeId
        })
        return index
    }
    getNodeIndexByOrd(target_ord){
        let index = undefined
        this.selectedParent.nodes.some((element,idx,arr) =>{
            if(element.ord==target_ord) index = idx
            return element.ord==target_ord
        })
        return index
    }
    getParentIndex(data_id){
        let result = undefined
        this.originData.department.some((item, index, array) =>{
            if(item.data_id==data_id) result = index
            return (item.data_id==data_id)
        })
        return result
    }
    getAllNodes(){
        let treeViewObject = $('#tree').data('treeview'),
            allCollapsedNodes = treeViewObject.getCollapsed(),
            allExpandedNodes = treeViewObject.getExpanded(),
            allNodes = allCollapsedNodes.concat(allExpandedNodes);
        return allNodes;
    }
    /**
        @method TreeViewController.makeDataForm
        @description
        make data form to load tree view
        @param {object} data departments, doctors data
    **/
    makeDataForm(data){
        let form = []
        data.department.forEach(department => {
            let doctors = []
            
            department.doctors.forEach(doctor =>{
                let doctor_data = doctor
                doctor_data['text'] = doctor.name 
                doctor_data['selectable'] = true
                doctor_data['state'] = {
                    checked: (doctor_data['check_flag']==1?true:false),
                }
                
                if((typeof doctor_data['academy'])=="string"){
                    let academy_list = doctor_data['academy'].split("!")
                    doctor_data['academy']=[]
                    academy_list.forEach((item,index,array)=>{
                        doctor_data['academy'].push({
                            ord: index+1,
                            value : item
                        })
                    })
                    if(academy_list.length==0){
                        doctor_data['academy'].push({
                            ord: 1,
                            value : ""
                        })
                    }
                }
                if((typeof doctor_data['career'])=="string"){
                    let career_list = doctor_data['career'].split("!")
                    doctor_data['career']=[]
                    career_list.forEach((item,index,array)=>{
                        doctor_data['career'].push({
                            ord: index+1,
                            value : item
                        })
                    })
                    if(career_list.length==0){
                        doctor_data['career'].push({
                            ord: 1,
                            value : ""
                        })
                    }
                }
                if((typeof doctor_data['education'])=="string"){
                    let education_list = doctor_data['education'].split("!")
                    doctor_data['education']=[]
                    education_list.forEach((item,index,array)=>{
                        doctor_data['education'].push({
                            ord: index+1,
                            value : item
                        })
                    })
                    if(education_list.length==0){
                        doctor_data['education'].push({
                            ord: 1,
                            value : ""
                        })
                    }
                }
                
                doctors.push(doctor_data)
            })
            let department_data = department
            department_data['text'] = department.title_korean
            department_data['selectable'] = true
            department_data['state'] = {
                checked: (department_data['check_flag']==1?true:false),
                expanded: false,
            }
            
            department_data['nodes'] = doctors
            
            form.push(department_data)

        });
        let result = [{
            text: "부서",
            selectable: false,
            state: {
                checked: true,
                expanded: true,
            },
            nodes: form
        }]
        return result;
    }
    /**
        @method TreeViewController.angularCallback
        @description
        set callback which can define from angularJs controller codes
        @param {string} eventType event type
        @param {object} data event data
    **/
    angularCallback(eventType, data){
        if(this.callbacks.list.includes(eventType)){
            this.callbacks[eventType](data)
        }
    }

    getUUID() { // UUID v4 generator in JavaScript (RFC4122 compliant)
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 3 | 8);
            return v.toString(16);
        });
    }
}