import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';

class UserController {
  // Cadratrar Usuario
  async store(req, res) {
    // Yup faz a validacao dos dados enviado no corpo da requisicao [schema]
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      password: Yup.string().required().min(6),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    // Verifica se existe o mesmo email no danco de dados
    const usersExist = await User.findOne({ where: { email: req.body.email } });
    if (usersExist) {
      return res.status(400).json({ erro: 'User already existya' });
    }

    // Depois de passar por todas as verificacao, pode cadastrar
    const { id, name, email, provider } = await User.create(req.body);
    return res.json({ id, name, email, provider });
  }

  // Cadratrar Usuario
  async update(req, res) {
    // Yup faz a validacao dos dados enviado no corpo da requisicao [schema]
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6), // Faz um verificacao de foi informado a senha antiga, se sim, preencha a nova senha e confirma ela
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ), // Nova senha
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ), // Confirma a nova senha
    });
    // Se estiver os campos obrigatorios que foi defina no Yup, retornara um erro
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    // Verficacao ok, Atualiza o Usuario Cuja o id for igual a [req.userId] que e enviado na requisicao quando esta com o token
    const { email, oldPassword } = req.body;
    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      const usersExist = await User.findOne({ where: { email } });
      if (usersExist) {
        return res.status(400).json({ erro: 'User already existya' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    await user.update(req.body);
    const { id, name, avatar } = await User.findByPk(req.userId, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json({ id, name, email, avatar });
  }
}

export default new UserController();
