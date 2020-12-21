(function(){
    $(document).ready(function() {
        $('#join_form').submit(function(){
            var $usernameInput = $('#join_form input[name=username]');
            var $passwordInput = $('#join_form input[name=password]');
            var $passwordInput2 = $('#join_form input[name=password2]');
            var $displayname = $('#join_form input[name=displayname]');
            var $groupname = $('#join_form input[name=usergroup]');

            if(!$usernameInput.val()){
                alert("아이디를 입력해주세요.");
                $usernameInput.focus();
                return false;
            }
            if(!$passwordInput.val()){
                alert("패스워드를 입력해주세요.");
                $passwordInput.focus();
                return false;
            }
            if(!$passwordInput2.val()){
                alert("확인 패스워드를 입력해주세요.");
                $passwordInput2.focus();
                return false;
            }
            if(!$displayname.val()){
                alert("이름을 입력해주세요.");
                $displayname.focus();
                return false;
            }
            if(!$groupname.val()){
                alert("그룹을 입력해주세요.");
                $groupname.focus();
                return false;
            }
            if($passwordInput.val() !== $passwordInput2.val()){
                alert("패스워드와 확인용패스워드를 똑같이 입력해주세요.");
                return false;
            }
            return true;
        });
    });
})();