import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                感谢注册！
              </CardTitle>
              <CardDescription>请检查你的邮箱以确认账户</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                注册成功！我们已向你的邮箱发送了一封确认邮件。
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium">接下来请：</p>
                <ol className="list-decimal list-inside space-y-1 ml-1">
                  <li>打开你的邮箱（包括垃圾邮件文件夹）</li>
                  <li>点击邮件中的确认链接</li>
                  <li>你将被自动重定向到仪表板</li>
                </ol>
              </div>
              <div className="flex gap-3 pt-4">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">
                    返回主页
                  </Button>
                </Link>
                <Link href="/auth/login" className="flex-1">
                  <Button className="w-full">
                    已确认，去登录
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
