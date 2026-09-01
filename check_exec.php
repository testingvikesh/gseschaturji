<?php
echo "shell_exec: ".(function_exists("shell_exec")?"OK":"OFF")."\n";
echo "exec: ".(function_exists("exec")?"OK":"OFF")."\n";
echo "finfo: ".(class_exists("finfo")?"OK":"OFF")."\n";
echo "pdo: ".(class_exists("PDO")?"OK":"OFF")."\n";

