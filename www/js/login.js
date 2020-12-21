(function(){
    $(document).ready(function() {
        $(".bg-case").height($(window).height());
        $('#login_form').submit(function(){
            
            var $usernameInput = $('#login_form input[name=username]');
            var $passwordInput = $('#login_form input[name=password]');

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

            return true;
        });
    });
    $(window).resize(function () {
        $(".bg-case").height($(window).height());
    });
})();