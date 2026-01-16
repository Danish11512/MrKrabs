export const Footer = (): React.JSX.Element => {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-8 py-6">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Financial Dashboard. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
