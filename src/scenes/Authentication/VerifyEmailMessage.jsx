import { Link } from "react-router-dom";
import "../../../src/index.css"

const VerifyEmailMessage = () => {

  return (
    <>
      <div className="p-4 box">
        <h2>Email Verification Required</h2>
        <p>Please check your email and verify your account to access the content.</p>
      </div>
      <div className="p-4 box">
        Return to Log In <Link to="/">Log In</Link>
      </div>
    </>
  );

};

export default VerifyEmailMessage;