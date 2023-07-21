#! /bin/bash
HELP="🅾	Usage:  `basename $0` config_file
🅾	---------------------------------------
🅾	<config_file> :	/home/long_read/LRS/script/Lrs_thal_pipeline2/source/lrs_thal.config
🅾	<note> :	use to run long read THAL pipeline
🅾	---------------------------------------
🅾	author :Jc"


usage() {
    cat <<- EOF >&2
🟥🟧🟨🟨🟩🟦🟪🟫 🤡 HELP 🤡 🟫🟪🟦🟩🟨🟧🟥
$HELP
🟥🟧🟨🟨🟩🟦🟪🟫⬛⬛⬛⬛⬛⬛🟫🟪🟦🟩🟨🟧🟥
EOF
    exit 1
}
if (( $# != 1 )) || [[ ! -e $1 ]];then
usage
fi

raw_config=$1 && shift 1 &&echo "loading config" && . $raw_config

if [[ ! -z $VERSION ]] && [[ ! -z $function_sh ]];then
echo -e "pipeline VERSION: $VERSION\nNOTES：$NOTES\nworkflow:$workflow"
. $function_sh
else
echo "ERROR: config file illegal"
usage
fi


mkdir -p $outdir
config=$outdir/$(basename $config)$JOB_ID
cp $raw_config $config

################ filter #################
if [[ "$workflow" == *1* ]];then
stepon filter
steprun $s_filter $config
stepoff filter
fi

################ splitter ###############
if [[ "$workflow" == *2* ]];then
stepon splitter
steprun $s_splitter $config
stepoff splitter
fi

############## indexfq ################
if [[ "$workflow" == *3* ]];then
stepon indexfq
steprun $s_indexfq $config
stepoff indexfq
fi


################ split2Hap ################
if [[ "$workflow" == *4* ]];then
stepon split2Hap
steprun $s_peaks2Hap $config
stepoff split2Hap
fi

############### page_simulator #########
if [[ "$workflow" == *5* ]];then
stepon page_simulator
steprun $s_page_simulator $config
stepoff page_simulator
fi


# ############## correct ################
if [[ "$workflow" == *6* ]];then
stepon correct
steprun $s_correct $config
stepoff correct
fi

################ mapper ################
if [[ "$workflow" == *7* ]];then
stepon mapper
steprun $s_mapper $config
stepoff mapper
fi

############### snv caller #############
if [[ "$workflow" == *8* ]];then
stepon snvcaller
steprun $s_snvcall $config
stepoff snvcaller
fi


############### SVcaller ################
if [[ "$workflow" == *9* ]];then
stepon SVcaller
steprun $s_svcaller $config
stepoff SVcaller
fi

############### snv anno #############
if [[ "$workflow" == *x* ]];then
stepon snvanno
steprun $s_snvanno $config
stepoff snvanno
fi

############### sv anno #############
if [[ "$workflow" == *y* ]];then
stepon svanno
steprun $s_svanno $config
stepoff svanno
fi

############### abpoa #############
if [[ "$workflow" == *p* ]];then
stepon abpoa
steprun $s_abpoa $config
stepoff abpoa
fi



############### report ##############
if [[ "$workflow" == *z* ]];then
stepon report
steprun $s_report $config
stepoff report
fi


###

###


stepall
