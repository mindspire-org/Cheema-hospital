import bcrypt from 'bcryptjs'
import { connectDB } from './config/db'
import { AestheticUser } from './modules/aesthetic/models/User'
import { DiagnosticUser } from './modules/diagnostic/models/User'
import { HospitalUser } from './modules/hospital/models/User'
import { FinanceUser } from './modules/hospital/models/finance_User'
import { LabUser } from './modules/lab/models/User'
import { PharmacyUser } from './modules/pharmacy/models/User'
import { ReceptionUser } from './modules/reception/models/User'

interface UserDef {
  model: any
  username: string
  password: string
  role: string
  fullName?: string
  active?: boolean
}

const users: UserDef[] = [
  {
    model: HospitalUser,
    username: 'hospital_user',
    password: 'hospital123',
    role: 'admin',
    fullName: 'Hospital Admin',
    active: true,
  },
  {
    model: LabUser,
    username: 'lab_user',
    password: 'lab123',
    role: 'admin',
  },
  {
    model: PharmacyUser,
    username: 'pharmacy_user',
    password: 'pharmacy123',
    role: 'admin',
  },
  {
    model: ReceptionUser,
    username: 'reception',
    password: '123',
    role: 'admin',
  },
  {
    model: FinanceUser,
    username: 'finance',
    password: '123',
    role: 'admin',
  },
]

async function ensureUser(userDef: UserDef) {
  const existing = await userDef.model.findOne({ username: userDef.username }).lean()
  if (existing) {
    console.log(`User "${userDef.username}" already exists, skipping...`)
    return false
  }

  const passwordHash = await bcrypt.hash(userDef.password, 10)
  const doc: any = {
    username: userDef.username,
    role: userDef.role,
    passwordHash,
  }

  if (userDef.fullName !== undefined) doc.fullName = userDef.fullName
  if (userDef.active !== undefined) doc.active = userDef.active

  await userDef.model.create(doc)
  console.log(`Created user: ${userDef.username} (${userDef.model.modelName || userDef.model.name})`)
  return true
}

async function main() {
  console.log('Connecting to database...')
  await connectDB()
  console.log('Database connected.\n')

  let created = 0
  let skipped = 0

  for (const userDef of users) {
    const result = await ensureUser(userDef)
    if (result) created++
    else skipped++
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Error creating users:', err)
  process.exit(1)
})
