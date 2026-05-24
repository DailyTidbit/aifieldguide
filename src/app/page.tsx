import { redirect, RedirectType } from 'next/navigation'

export default function Home() {
  redirect('/field-guide', RedirectType.replace)
}
