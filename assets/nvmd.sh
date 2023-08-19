#!/usr/bin/env bash

# reference avn
# https://github.com/wbyoung/avn

if [[ -n "${BASH_VERSION:-}" ]]; then
  true
elif [[ -n "${ZSH_VERSION:-}" ]]; then
  setopt null_glob
else
  printf "%b" "nvmd does not yet support this shell\n"
fi

# plugins may add to this, it's an array of version file names
export -a __nvmd_files
__nvmd_files=(".nvmdrc")

# nvmd chpwd hook
function __nvmd_chpwd() {
  local file=$(__nvmd_find_file)
  local dir=${file%/*}
  local name=${file##*/}

  if [[ -n "$file" ]] && [[ "$file" != "$__nvmd_active_file" ]]; then
    CURRENT_VERSION=$(cat "$file")
    if test -e "$HOME/.nvmd/versions/$CURRENT_VERSION/bin"; then
      export PATH="$HOME/.nvmd/versions/$CURRENT_VERSION/bin:$PATH"
    else
      printf "%b" "[nvmd]: the node version of $CURRENT_VERSION has not installed yet\n"
    fi
  else
    if test -e "$HOME/.nvmd/default"; then
      CURRENT_VERSION=$(cat "$HOME/.nvmd/default")
      export PATH="$HOME/.nvmd/versions/$CURRENT_VERSION/bin:$PATH"
    fi
  fi

  __nvmd_active_file=$file
}

# find version specification file
function __nvmd_find_file() {
  local found
  local dir=$PWD
  while [[ -z "$found" ]] && [[ "$dir" != "" ]]; do
    for file in "${__nvmd_files[@]}"; do
      if [[ -f "$dir/$file" ]]; then
        found="$dir/$file"
        break
      fi
    done
    if [[ "$dir" == "$HOME" ]]; then
      break
    fi
    dir=${dir%/*}
  done
  echo $found
}

__nvmd_chpwd # run chpwd once since the shell was just loaded

##
# Hooks that will happen after the working directory is changed
#

export -a chpwd_functions

# add nvmd functionality
[[ " ${chpwd_functions[*]} " == *" __nvmd_chpwd "* ]] ||
  chpwd_functions+=(__nvmd_chpwd)

# support rvm until chpwd_functions are integrated
[[ " ${chpwd_functions[*]} " == *" __rvm"* ]] ||
  chpwd_functions+=(__rvm_cd_functions_set)

function __zsh_like_cd() {
  \typeset __zsh_like_cd_hook
  if
    builtin "$@"
  then
    for __zsh_like_cd_hook in chpwd "${chpwd_functions[@]}"; do
      if \typeset -f "$__zsh_like_cd_hook" >/dev/null 2>&1; then
        "$__zsh_like_cd_hook" || break # finish on first failed hook
      fi
    done
    true
  else
    return $?
  fi
}

[[ -n "${ZSH_VERSION:-}" ]] ||
  {
    function cd() { __zsh_like_cd cd "$@"; }
    function popd() { __zsh_like_cd popd "$@"; }
    function pushd() { __zsh_like_cd pushd "$@"; }
  }
