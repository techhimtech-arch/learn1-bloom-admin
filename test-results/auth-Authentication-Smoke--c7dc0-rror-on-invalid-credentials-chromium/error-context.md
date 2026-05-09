# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - heading "School Management" [level=1] [ref=e10]
      - paragraph [ref=e11]: Admin Panel
    - generic [ref=e12]:
      - generic [ref=e13]:
        - heading "Welcome back" [level=3] [ref=e14]
        - paragraph [ref=e15]: Sign in to your account
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]:
            - text: Email
            - textbox "Email" [ref=e19]:
              - /placeholder: admin@school.edu
          - generic [ref=e20]:
            - generic [ref=e21]:
              - generic [ref=e22]: Password
              - link "Forgot password?" [ref=e23] [cursor=pointer]:
                - /url: /forgot-password
            - generic [ref=e24]:
              - textbox "Password" [ref=e25]:
                - /placeholder: ••••••••
              - button [ref=e26] [cursor=pointer]:
                - img [ref=e27]
        - generic [ref=e30]:
          - button "Sign In" [ref=e31] [cursor=pointer]
          - button "Install App" [ref=e32] [cursor=pointer]:
            - img
            - text: Install App
```