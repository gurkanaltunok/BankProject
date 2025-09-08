using System;
using System.Security.Cryptography;

namespace BankProject.Business.Helpers
{
    public static class IbanHelper
    {
        private const string CountryCode = "TR";
        private const string BankCode = "00224";
        private const string ReserveDigit = "0";

        public static string GenerateIban(int userId)
        {
            // Rastgele sayı üretici
            using var rng = RandomNumberGenerator.Create();
            byte[] bytes = new byte[8];
            rng.GetBytes(bytes);

            long randomNumber = BitConverter.ToInt64(bytes, 0);
            if (randomNumber < 0) randomNumber *= -1;

            string accountNumber = (userId.ToString() + randomNumber.ToString())
                                    .PadRight(16, '0')
                                    .Substring(0, 16);

            string ibanWithoutCheckDigits = CountryCode + "00" + BankCode + ReserveDigit + accountNumber;

            int checkDigits = CalculateCheckDigits(ibanWithoutCheckDigits);

            return $"{CountryCode}{checkDigits:D2}{BankCode}{ReserveDigit}{accountNumber}";
        }

        private static int CalculateCheckDigits(string input)
        {
            string rearranged = input.Substring(4) + input.Substring(0, 4);
            string numeric = "";
            foreach (char c in rearranged)
            {
                if (char.IsLetter(c))
                    numeric += (c - 'A' + 10).ToString();
                else
                    numeric += c;
            }

            int remainder = 0;
            foreach (char digit in numeric)
            {
                int d = digit - '0';
                remainder = (remainder * 10 + d) % 97;
            }
            return 98 - remainder;
        }
    }
}
