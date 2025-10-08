import { SignIn } from "@clerk/clerk-react";
import "./SignInPage.css";

export default function SignInPage() {
  return (
    <div className="signInPageContainer">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" afterSignInUrl="/home" />
    </div>
  );
}
