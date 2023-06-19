
export const rules = {
  required: (v: string) => !v && '入力必須です',
  emailFormat: (v: string) => !(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(String(v).toLowerCase())) && '正しいフォーマットではありません',
  passwordFormat: (v: string) => !/^[A-Za-z0-9.,!?-_#$%&@\[\]:;+*/-]*$/.test(v) && '正しいフォーマットではありません',
  max: (len: number) => (v: string) => v.length > len && `最大${len}文字までです`,
}

export const validate = (rules, v) => {
  for(const rule of rules) {
    if(rule(v)) return rule(v)
  }
  return;
}