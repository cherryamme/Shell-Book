
usage() {
    # Function: Print a help message.
cat <<- EOF >&2
>>>>>>>>>>>>>>>    HELP    >>>>>>>>>>>>>>>>>
$HELP
>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
EOF
}

steprun(){
    echo "<command>: $@"
    $@
}

#检查文件是否存在
check_file(){
if (( $# == 0 ));then
    cat >&2 <<'EOF'
    Usage: check_file file1 file2 ...
EOF
else
    local var
    echo ">>> check_file:"
    while (( $# > 0 ));do
        eval var=\${$1}
        if [[ ! -e $var ]];then
            echo "ERROR:Detect $1:$var not exist Please check"
            exit 1
        else
            echo "    $1:$var"
        fi
        shift
    done
fi
}


check_int(){
if (( $# == 0 ));then
    cat >&2 <<'EOF'
    Usage: check_int int1 int2 ...
EOF
else
    local var
    echo ">>> check_int:"
    while (( $# > 0 ));do
        eval var=\${$1}
        if [[ ! $var =~ ^[0-9]+$ ]];then
            echo "ERROR:Detect $1:$var not an int Please check"
            exit 1
        else
            echo "    $1:$var"
        fi
        shift
    done
fi
}

check_var(){
# setopt localoptions noautopushd
if (( $# == 0 ));then
        cat >&2 <<'EOF'
    Usage: check_var var1 var2 ...
EOF
else
    local var
    echo ">>> check_var:"
    while (( $# > 0 ));do
        eval var=\${$1}
        if [[ -z $var ]];then
            echo "ERROR:Detect $1:$var empty Please check"
            exit 1
        else
            echo "    $1:$var"
        fi
        shift
    done
fi
}





load_cfg() {
    local config_file="$1"

    if [[ ! -f "$config_file" ]]; then
        echo "Error: Config file not found"
        exit 0
    fi

    echo "<loading config>"
    while read -r line; do
        if [[ -z "${line// }" ]] || [[ ${line:0:1} == "#" ]] ||  [[ "${line:0:1}" == "[" && "${line: -1}" == "]" ]]; then
            continue
        fi
        if [[ $line =~ ^[a-zA-Z0-9_-]+=.+$ ]]; then
            echo "  $line"
            eval export $line
        else
            echo "Error: Invalid config format. Expected format: a=b"
            exit 0
        fi
    done < "$config_file"
}






# explain a data array
explain() {
    # setopt localoptions noautopushd
        if (( $# == 0 ))
        then
                cat >&2 <<'EOF'
Usage: explain [array ...]

EOF
else
while (( $# > 0 ))
        do
                if [[ ! -z "$1" ]]
                then
                        eval echo -e "variable: '$1' Length is \${#$1[*]}\\\n\\\t \(\${$1[*]}\)"
                        shift
                        continue
                else
                    echo -e "$1 is not a valid variable"
                fi
                shift
        done
fi
}

transpose(){
        if (( $# == 0 ))
        then
                cat >&2 <<'EOF'
Usage: transpose [file]
      transpose a file from row to col(default by space).
EOF
else
  tab=${2:- }
  awk -v FS="," '{
    for (i=1;i<=NF;i++){
        if (NR==1){
            res[i]=$i
        }
        else{
            res[i]=res[i]":\t"$i
        }
    }
}END{
    for(j=1;j<=NF;j++){
        print res[j]
    }
}' $1
fi
}




# calculate step cost time
unset cost_time start_time
stepon(){
    if (( $# == 0 ))
    then
        cat >&2 <<'EOF'
     Usage: Sstart [name]
EOF
else
        declare -Axg start_time
        start_time["$1"]=$(date +%s)
        echo "##################### $1 ##############################"
        echo -e "Step $1 ——START TIME :`date +"%Y-%m-%d %H:%M.%S"`"
fi
}

stepoff(){
        if (( $# == 0 ))
        then
                cat >&2 <<'EOF'
Usage: Stend [name]
EOF
else
                declare -Axg cost_time
                declare -Axg total_time
                diff_time=$(( ( $(date +%s) - ${start_time[$1]} ) ))
                diff_h=$[diff_time/3600]
                diff_m=$[diff_time%3600/60+1]
                total_time[$1]=$diff_time
                cost_time[$1]="$diff_h h $diff_m min"
        echo -e "Step $1 ——END TIME :`date +"%Y-%m-%d %H:%M.%S"` \t cost_time :${cost_time[$1]}"
        echo "##################### $1 ##############################"
fi
}


stepall(){
    declare -Axg start_time
    declare -Axg cost_time
    declare -Axg total_time
    total_cost_time=0
    echo "#######################################################"
    echo -e All Step length: ${#start_time[*]} "\t("${!start_time[*]} ")"
    for i in ${!start_time[*]}
    do
        echo -e "Step "$i"\t\tcost_time: " ${cost_time[$i]}"\tSTART: "`date -d @${start_time[$i]} +"%Y-%m-%d %H:%M.%S"`
        total_cost_time=$((total_cost_time + total_time[$i]))
    done
    diff_h=$[total_cost_time/3600]
    diff_m=$[total_cost_time%3600/60+1]
    total_cost_time="$diff_h h $diff_m min"
    echo -e "Total_cost_time: \t$total_cost_time"
    echo "#######################################################"
}
