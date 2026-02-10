import bcrypt from "bcryptjs";

const generarHash = async () => {
  const hash = await bcrypt.hash("123456", 10);
  console.log("Hash generado:");
  console.log(hash);
};

generarHash();
