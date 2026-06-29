import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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
            <CardContent>
              <p className="text-sm text-muted-foreground">
                注册成功！请检查你的邮箱以确认账户。确认后就可以开始使用了。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
