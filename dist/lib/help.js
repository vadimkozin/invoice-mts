import path from 'node:path';
const nameProgramm = path.basename(process.argv[1]);
export const help = `\nCreating pdf documents (act, invoice, account) from data in database or csv-files
used: node ${nameProgramm} -p2021_12  -b|-f  -aitc
-p (--period)   period, ex. 2021_12 and saved (csv) in ./source/2021_12
-b (--base)     get data from database
-f (--file)     get data from files (csv) in ./source/period
-c (--compress) compress result
-a (--act)      create Act
-i (--invoice)  create Invoice
-t (--account)  create Account
-n (--notice)   create Notice (for persons)
-d (--detail)   calls detail
-x (--all)      calls all documents: -x == -aitnd

example:
node ${nameProgramm} -p2021_12 -b  // get data from database, period 2021_12 and saved in ./source/2021_12
node ${nameProgramm} -p2021_12 -b -ait // get data from database and create Act, Invoice, Account
node ${nameProgramm} -p2021_12 -b -x  // get data from database and created ALL documents
(in plans ..)
node ${nameProgramm} -p2021_12 -f -ait // get csv-files from ./source/2021_12 and create Act, Invoice, Account
node ${nameProgramm} -p2021_12 -f -aitc // just like the last one + compress result


ps. for key -f : directory ./source/2021_12 must contain customers.csv & book.csv , ..
`;
