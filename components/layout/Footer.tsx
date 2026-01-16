export const Footer = (): React.JSX.Element => {
  return (
    <footer className="border-t bg-background">
      <div className="px-8 py-6">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Mr.Krabs. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
