import { SignUp } from "@clerk/clerk-react";
import "./SignUpPage.css";

export default function SignUpPage() {
  return (
    <div className="signUpPageContainer">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" afterSignUpUrl="/home" />
    </div>
  );
}
