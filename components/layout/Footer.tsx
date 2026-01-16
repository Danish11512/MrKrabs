export const Footer = (): React.JSX.Element => {
  return (
    <footer className="backdrop-blur-xl backdrop-saturate-150 border-t border-[var(--glass-border-light)] dark:border-[var(--glass-border-dark)] bg-[var(--glass-bg-light)] dark:bg-[var(--glass-bg-dark)] shadow-lg dark:shadow-[var(--shadow-dark)] rounded-t-xl">
      <div className="px-8 py-6">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Mr.Krabs. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
