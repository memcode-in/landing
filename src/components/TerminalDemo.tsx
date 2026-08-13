import CliTerminal from './marketing/CliTerminal'

const commands = [
  {
    command: 'memcode',
    output: [
      'memCode v1.0.0 — AI coding agent',
      'Model: deepseek-v4-pro · Memory: 847 contexts loaded',
    ],
  },
  {
    command: 'Fix the auth bug in src/auth.ts',
    output: [
      'Reading src/auth.ts…',
      'Found issue: token expiry not checked on refresh.',
      'Proposed edit to src/auth.ts (+4 -1 lines)',
      '✓ Applied. Running tests…',
      '✓ 12 tests passed',
    ],
  },
]

export default function TerminalDemo() {
  return (
    <section className="terminal-demo">
      <div className="container">
        <CliTerminal
          title="memcode — ~/my-app"
          ariaLabel="MemCode terminal session"
          commands={commands}
        />
      </div>
    </section>
  )
}
