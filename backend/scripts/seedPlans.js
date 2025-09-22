const { Plan } = require('../src/models');

async function seedPlans() {
  try {
    console.log('🌱 Iniciando seed dos planos...');

    // Verificar se os planos já existem
    const existingPlans = await Plan.findAll();
    if (existingPlans.length > 0) {
      console.log('✅ Planos já existem no banco de dados');
      return;
    }

    // Criar planos padrão
    const plans = await Plan.bulkCreate([
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'free',
        displayName: 'Plano Free',
        description: 'Plano gratuito com limitações básicas',
        price: 0.00,
        maxSubjects: 2,
        maxQuestions: 10,
        maxExams: 1,
        isActive: true,
        features: {
          pdfExport: true,
          basicSupport: true
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'plus',
        displayName: 'Plano Plus',
        description: 'Plano completo com recursos ilimitados',
        price: 19.99,
        maxSubjects: -1,
        maxQuestions: -1,
        maxExams: -1,
        isActive: true,
        features: {
          pdfExport: true,
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: true
        }
      }
    ]);

    console.log('✅ Planos criados com sucesso:', plans.map(p => p.name));

    // Atualizar usuários existentes para usar o plano free por padrão
    const { User } = require('../src/models');
    const usersWithoutPlan = await User.findAll({
      where: { planId: null }
    });

    if (usersWithoutPlan.length > 0) {
      const freePlan = plans.find(p => p.name === 'free');
      await User.update(
        { planId: freePlan.id },
        { where: { planId: null } }
      );
      console.log(`✅ ${usersWithoutPlan.length} usuários atualizados para o plano free`);
    }

    console.log('🎉 Seed dos planos concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao fazer seed dos planos:', error);
    throw error;
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  seedPlans()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedPlans;