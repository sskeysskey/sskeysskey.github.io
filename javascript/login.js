document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // prevent form submission

    // Get input values
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // Perform validation (you can customize this according to your requirements)
    if (username === '' || password === '') {
        alert('请输入用户名和密码');
    } else {
        alert('登录成功！'); // Placeholder for actual login logic
    }
});
