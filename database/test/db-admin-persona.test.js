const { describe, it } = require('mocha')
const assert = require('assert')
const postPersonas = require('../layer/admin-persona.js')
const { usherDb } = require('../layer/knex')

describe('Admin persona view', () => {
  describe('Test INSERT personas', () => {
    it('Should insert persona without an exception', async () => {
      const insertResult = await postPersonas.insertPersona('test-tenant1', 'http://idp.dmgt.com.mock.localhost:3002/', 'test-dmgt-oocto-1@dmgtoocto.com', '')
      assert.strictEqual(insertResult, 'Insert successful')
      await postPersonas.deletePersona('test-tenant1', 'http://idp.dmgt.com.mock.localhost:3002/', 'test-dmgt-oocto-1@dmgtoocto.com', '')
    })
    it('Should fail to insert for a nonexistent tenant', async () => {
      const insertResult = await postPersonas.insertPersona('test-tenant1 Non-existent', 'http://idp.dmgt.com.mock.localhost:3002/', 'test-dmgt-oocto-3@dmgtoocto.com', '')
      assert.strictEqual(insertResult, 'Insert failed: Tenant does not exist matching tenantname test-tenant1 Non-existent iss_claim http://idp.dmgt.com.mock.localhost:3002/')
    })
    it('Should fail to insert duplicate tenant/persona combination - check tenantname', async () => {
      await postPersonas.insertPersona('test-tenant1', 'http://idp.dmgt.com.mock.localhost:3002/', 'test-dmgt-oocto-x@dmgtoocto.com', '')
      const result = await postPersonas.insertPersona('test-tenant1', 'http://idp.dmgt.com.mock.localhost:3002/', 'test-dmgt-oocto-x@dmgtoocto.com', '')
      assert.strictEqual(result, 'Insert failed: A persona (sub_claim = test-dmgt-oocto-x@dmgtoocto.com; user_context = ) already exists on tenantname test-tenant1 iss_claim http://idp.dmgt.com.mock.localhost:3002/')
      await postPersonas.deletePersona('test-tenant1', 'http://idp.dmgt.com.mock.localhost:3002/', 'test-dmgt-oocto-x@dmgtoocto.com', '')
    })
    it('Should insert persona by tenant key without an exception', async () => {
      const subClaim = 'test-user@the-usher.com'
      const [tenant] = await usherDb('tenants').select('*').limit(1)
      const persona = await postPersonas.insertPersonaByTenantKey(tenant.key, subClaim)
      assert.strictEqual(persona.sub_claim, subClaim)
      await usherDb('personas').where({ key: persona.key }).del()
    })
  })

  describe('Test UPDATE personas', () => {
    it('Should update persona without an exception by tenantname', async () => {
      await postPersonas.insertPersona('test-tenant1', 'http://idp.dmgt.com.mock.localhost:3002/', 'test-dmgt-oocto-5@dmgtoocto.com', '')
      const resultTenantname = await postPersonas.updatePersona('test-tenant1', 'http://idp.dmgt.com.mock.localhost:3002/', 'test-dmgt-oocto-5@dmgtoocto.com', 'test-dmgt-oocto-7@dmgtoocto.com', '', '')
      assert.strictEqual(resultTenantname, 'Update successful')
      await postPersonas.deletePersona('test-tenant1', 'http://idp.dmgt.com.mock.localhost:3002/', 'test-dmgt-oocto-7@dmgtoocto.com', '')
    })
    it('Should fail to update for a nonexistent tenant', async () => {
      const resultTenantname = await postPersonas.updatePersona('test-tenant1 Non-existent', 'http://idp.dmgt.com.mock.localhost:3002/', 'auth0|test-persona2-REPLACE', 'should_not_replace_sub_claim', '', '')
      assert.strictEqual(resultTenantname, 'Update failed: A persona (sub_claim = auth0|test-persona2-REPLACE; user_context = ) does not exist on tenantname test-tenant1 Non-existent iss_claim http://idp.dmgt.com.mock.localhost:3002/')
    })
    it('Should fail to update for a nonexistent persona', async () => {
      const resultTenantname = await postPersonas.updatePersona('test-tenant1', 'http://idp.dmgt.com.mock.localhost:3002/', 'does-not-exist@dmgtoocto.com', 'should_not_replace_sub_claim', '', '')
      assert.strictEqual(resultTenantname, 'Update failed: A persona (sub_claim = does-not-exist@dmgtoocto.com; user_context = ) does not exist on tenantname test-tenant1 iss_claim http://idp.dmgt.com.mock.localhost:3002/')
    })
  })

  describe('Test DELETE personas', () => {
    it('Should fail to delete a persona not linked to a tenant', async () => {
      const resultDelete = await postPersonas.deletePersona('test-tenant1', 'http://idp.dmgt.com.mock.localhost:3002/', 'no-persona@dmgtoocto.com', '')
      assert.strictEqual(resultDelete, 'Delete failed: A persona (sub_claim = no-persona@dmgtoocto.com; user_context = ) does not exist on tenantname test-tenant1 iss_claim http://idp.dmgt.com.mock.localhost:3002/')
    })
  })
})
